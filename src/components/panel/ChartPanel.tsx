import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as F from "@effect/core/io/Fiber"
import * as React from "react"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as MB from "@tsplus/stdlib/data/Maybe"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import { RuntimeContext } from "@components/App"
import * as GDS from "@core/metrics/service/GraphDataService"
import * as GDM from "@core/metrics/service/GraphDataManager"
import { Chart } from "chart.js/auto"
import { pipe } from "@tsplus/stdlib/data/Function"
import { keyAsString } from "@core/metrics/model/zio/MetricKey"

// required import for time based axis
import "chartjs-adapter-date-fns"

interface ChartData {
  tsConfig: TS.TimeSeriesConfig
  data: { x: Date; y: number }[]
}

type TSData = HMap.HashMap<TS.TimeSeriesKey, ChartData>

export const ChartPanel: React.FC<{ id: string }> = (props) => {
  const appRt = React.useContext(RuntimeContext)

  // The reference to the canvas, so the chart has something to draw on
  const chartRef = React.createRef<HTMLCanvasElement>()

  const [chartData, setChartData] = React.useState<TSData>(HMap.empty)

  // derive a label from a time series key
  const label = (tsKey: TS.TimeSeriesKey) => {
    const mbSub = MB.map((s) => `-${s}`)(tsKey.subKey)
    return `${keyAsString(tsKey.key.key)}${MB.getOrElse(() => "")(mbSub)}`
  }

  // The callback that will handle incoming updates to the graph data
  const updateState = (newData: GDS.GraphData) => {
    const newState = HMap.reduceWithIndex(
      HMap.empty(),
      (s: TSData, k: TS.TimeSeriesKey, v: C.Chunk<TS.TimeSeriesEntry>) => {
        const mbConfig = MB.map<ChartData, TS.TimeSeriesConfig>((d) => d.tsConfig)(
          HMap.get<TS.TimeSeriesKey, ChartData>(k)(chartData)
        )

        const cfg = MB.getOrElse(() => new TS.TimeSeriesConfig(k, label(k)))(mbConfig)

        const cData = {
          tsConfig: cfg,
          data: Coll.toArray(v).map((e) => {
            return { x: e.when, y: e.value }
          })
        } as ChartData

        return HMap.set(k, cData)(s)
      }
    )(newData)

    setChartData(newState)
  }

  React.useEffect(() => {
    const updater = appRt.unsafeRunSync(
      T.gen(function* ($) {
        const gdm = yield* $(T.service(GDM.GraphDataManager))
        const gds = yield* $(gdm.lookup(props.id))
        const data = yield* $(gds.current())
        updateState(data)

        const updates = yield* $(gds.data())

        const updater = yield* $(
          pipe(
            S.runForEach((e: GDS.GraphData) =>
              T.sync(() => {
                updateState(e)
              })
            )(updates),
            T.forkDaemon
          )
        )

        return updater
      })
    )

    return () => {
      try {
        appRt.unsafeRunSync(F.interrupt(updater))
      } catch {}
    }
  }, [])

  const createChart = (ref: CanvasRenderingContext2D) => {
    return new Chart(ref, {
      type: "line",
      options: {
        animation: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute"
            }
          }
        },
        maintainAspectRatio: false
      },
      data: {
        datasets: Coll.toArray(HMap.values(chartData)).map((cd) => {
          return {
            label: cd.tsConfig.title,
            data: cd.data,
            tension: cd.tsConfig.tension,
            backgroundColor: cd.tsConfig.pointColor.toRgb(),
            borderColor: cd.tsConfig.lineColor.toRgba()
          }
        })
      }
    })
  }

  React.useEffect(() => {
    if (chartRef) {
      const ref = chartRef.current!.getContext("2d")!
      const chart = createChart(ref)
      return () => {
        chart.destroy()
      }
    }
  }, [chartData])

  return (
    <div className="w-full h-full">
      <canvas className="bg-neutral-content" ref={chartRef} />
    </div>
  )
}
