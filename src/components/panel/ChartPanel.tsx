/* A ChartPanel renders group of lines in a line chart. The data for the lines
 * is provided by an instance of GraphDataService. Each panel uses irs own instance
 * of GraphDataService, hence all ChartPanels are isolated from each other.
 * The GraphDataService survives mounting / unmounting the panel inside the UI, so the
 * chart data is preserved as well.
 *
 * The panel consumes changes from the GraphDataService and updates the chart accordingly.
 *
 */
import { RuntimeContext } from "@components/App"
import * as C from "@effect/data/Chunk"
import * as HMap from "@effect/data/HashMap"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as F from "@effect/io/Fiber"
import * as RT from "@effect/io/Runtime"
import * as S from "@effect/stream/Stream"
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
  data: C.Chunk<{ x: Date; y: number }>
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
    const mbSub = Opt.map((s) => `-${s}`)(tsKey.subKey)
    return `${keyAsString(tsKey.key.key)}${Opt.getOrElse(() => "")(mbSub)}`
  }

  // The callback that will handle incoming updates to the graph data
  const updateState = (newData: GDS.GraphData) => {
    setChartData((current) => {
      return HMap.reduceWithIndex(
        newData,
        HMap.empty(),
        (s: TSData, v: C.Chunk<TS.TimeSeriesEntry>, k: TS.TimeSeriesKey) => {
          // TODO: Tap into the DashboardConfigService to retrieve the TSConfig
          const mbConfig = Opt.map<LineData, TS.TimeSeriesConfig>((d) => d.tsConfig)(
            HMap.get(current, k)
          )

          const cfg = Opt.getOrElse(() => new TS.TimeSeriesConfig(k, label(k)))(
            mbConfig
          )

          const cData = {
            tsConfig: cfg,
            data: C.map(v, (e) => {
              return { x: e.when, y: e.value }
            }),
          } as LineData

          return HMap.set(k, cData)(s)
        }
      )
    })
  }

  React.useEffect(() => {
    const createUpdater = T.gen(function* ($) {
      const gdm = yield* $(GDM.GraphDataManager)
      const gds = yield* $(gdm.lookup(props.id))
      const data = yield* $(gds.current())
      updateState(data)

      const updates = yield* $(gds.data())

      const updater = yield* $(
        T.forkDaemon(
          S.runForEach((e: GDS.GraphData) => T.attempt(() => updateState(e)))(updates)
        )
      )

      return updater
    })

    const f = RT.runSync(appRt)(createUpdater)

    return () => {
      RT.runPromise(appRt)(F.interrupt(f)).then((_) => {
        // ignore
      })
    }
  }, [])

  const chartDataSets = (() => {
    const ds = HMap.values(
      HMap.map(chartData, (cd) => {
        return {
          label: cd.tsConfig.title,
          data: [...cd.data],
          tension: cd.tsConfig.tension,
          backgroundColor: cd.tsConfig.pointColor.toRgb(),
          borderColor: cd.tsConfig.lineColor.toRgba(),
        }
      })
    )
    return Array(...ds)
  })()

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
        datasets: chartDataSets,
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
