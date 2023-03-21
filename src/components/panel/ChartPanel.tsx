// required import for time based axis
import { RuntimeContext } from "@components/App"
import * as T from "@effect/core/io/Effect"
import * as F from "@effect/core/io/Fiber"
import * as S from "@effect/core/stream/Stream"
import type * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as MB from "@tsplus/stdlib/data/Maybe"
import { Chart } from "chart.js/auto"
import "chartjs-adapter-date-fns"
import * as React from "react"

import * as TS from "@core/metrics/model/insight/TimeSeries"
import { keyAsString } from "@core/metrics/model/zio/metrics/MetricKey"
import * as GDM from "@core/metrics/services/GraphDataManager"
import type * as GDS from "@core/metrics/services/GraphDataService"

// A single line in the chart consists of the configuration for the visual
// properties of the line (color, line style, ...) and the array of points
interface LineData {
  tsConfig: TS.TimeSeriesConfig
  data: { x: Date; y: number }[]
}

// A chart constists of mutiple lines
type TSData = HMap.HashMap<TS.TimeSeriesKey, LineData>

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
    setChartData((current) => {
      return HMap.reduceWithIndex(
        HMap.empty(),
        (s: TSData, k: TS.TimeSeriesKey, v: C.Chunk<TS.TimeSeriesEntry>) => {
          // TODO: Tap into the DashboardConfigService to retrieve the TSConfig
          const mbConfig = MB.map<LineData, TS.TimeSeriesConfig>((d) => d.tsConfig)(
            HMap.get<TS.TimeSeriesKey, LineData>(k)(current)
          )

          const cfg = MB.getOrElse(() => new TS.TimeSeriesConfig(k, label(k)))(mbConfig)

          const cData = {
            tsConfig: cfg,
            data: Coll.toArray(v).map((e) => {
              return { x: e.when, y: e.value }
            }),
          } as LineData

          return HMap.set(k, cData)(s)
        }
      )(newData)
    })
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
      } catch {
        /* ignore */
      }
    }
  }, [])

  const createChart = (ref: CanvasRenderingContext2D) => {
    return new Chart(ref, {
      type: "line",
      options: {
        animation: false,
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: "time",
            time: {
              unit: "minute",
            },
          },
        },
      },
      data: {
        datasets: Coll.toArray(HMap.values(chartData)).map((cd) => {
          return {
            label: cd.tsConfig.title,
            data: cd.data,
            tension: cd.tsConfig.tension,
            backgroundColor: cd.tsConfig.pointColor.toRgb(),
            borderColor: cd.tsConfig.lineColor.toRgba(),
          }
        }),
      },
    })
  }

  React.useEffect(() => {
    const cur = chartRef.current
    if (cur) {
      const ref = cur.getContext("2d")
      if (ref) {
        const chart = createChart(ref)
        return () => {
          chart.destroy()
        }
      }
    }
  }, [chartData])

  return (
    <div className="grow flex relative">
      <canvas className="bg-neutral-content" ref={chartRef} />
    </div>
  )
}
