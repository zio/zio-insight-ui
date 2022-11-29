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
import { Chart } from "chart.js/auto"
import { pipe } from "@tsplus/stdlib/data/Function"
import { InsightKey, keyAsString } from "@core/metrics/model/zio/MetricKey"

// required import for time based axis
import "chartjs-adapter-date-fns"

interface ChartData {
  tsConfig: TS.TimeSeriesConfig
  data: { x: Date; y: number }[]
}

export const ChartContainer: React.FC<{ metricKey: InsightKey }> = (props) => {
  const [graphData, setGraphData] = React.useState<
    HMap.HashMap<TS.TimeSeriesKey, ChartData>
  >(HMap.empty())

  const appRt = React.useContext(RuntimeContext)

  const label = (tsKey: TS.TimeSeriesKey) => {
    const mbSub = MB.map((s) => `-${s}`)(tsKey.subKey)
    return `${keyAsString(tsKey.key.key)}${MB.getOrElse(() => "")(mbSub)}`
  }

  const updateState = (newData: GDS.GraphData) => {
    setGraphData((current) => {
      return HMap.mapWithIndex(
        (k: TS.TimeSeriesKey, v: C.Chunk<TS.TimeSeriesEntry>) => {
          const mbConfig = MB.map<ChartData, TS.TimeSeriesConfig>((d) => d.tsConfig)(
            HMap.get<TS.TimeSeriesKey, ChartData>(k)(current)
          )

          const cfg = MB.getOrElse(() => new TS.TimeSeriesConfig(k, label(k)))(mbConfig)

          return {
            tsConfig: cfg,
            data: Coll.toArray(v).map((e) => {
              return { x: e.when, y: e.value }
            })
          } as ChartData
        }
      )(newData)
    })
  }

  React.useEffect(() => {
    const [gds, updater] = appRt.unsafeRunSync(
      T.gen(function* ($) {
        const gds = yield* $(GDS.createGraphDataService())
        yield* $(gds.setMetrics(props.metricKey))
        yield* $(gds.setMaxEntries(Math.floor(Math.random() * 10 + 15)))

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

        return [gds, updater]
      })
    )

    return () => {
      try {
        appRt.unsafeRunSync(
          pipe(
            gds.close(),
            T.flatMap((_) => F.interrupt(updater))
          )
        )
      } catch {}
    }
  }, [])

  return (
    <div className="w-full h-full">
      <ChartPanel initialData={Coll.toArray(HMap.values(graphData))} />
    </div>
  )
}

const ChartPanel: React.FC<{ initialData: ChartData[] }> = (props) => {
  const chartRef = React.createRef<HTMLCanvasElement>()

  React.useEffect(() => {
    if (chartRef) {
      const ref = chartRef.current!.getContext("2d")!
      const chart = new Chart(ref, {
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
          datasets: props.initialData.map((cd) => {
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

      return () => {
        chart.destroy()
      }
    }
  }, [props.initialData])

  return (
    <div className="w-full h-full">
      <canvas className="bg-neutral-content" ref={chartRef} />
    </div>
  )
}
