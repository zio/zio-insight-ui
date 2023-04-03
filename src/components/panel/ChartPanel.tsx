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
import * as Chunk from "@effect/data/Chunk"
import * as HashMap from "@effect/data/HashMap"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Fiber from "@effect/io/Fiber"
import * as Runtime from "@effect/io/Runtime"
import * as Stream from "@effect/stream/Stream"
import { Chart } from "chart.js/auto"
import "chartjs-adapter-date-fns"
import * as React from "react"

import * as TimeSeries from "@core/metrics/model/insight/TimeSeries"
import { keyAsString } from "@core/metrics/model/zio/metrics/MetricKey"
import * as GraphDataManager from "@core/metrics/services/GraphDataManager"
import type * as GraphDataService from "@core/metrics/services/GraphDataService"

// A single line in the chart consists of the configuration for the visual
// properties of the line (color, line style, ...) and the array of points
interface LineData {
  tsConfig: TimeSeries.TimeSeriesConfig
  data: Chunk.Chunk<{ x: Date; y: number }>
}

// A chart constists of mutiple lines
type TSData = HashMap.HashMap<TimeSeries.TimeSeriesKey, LineData>

export const ChartPanel: React.FC<{ id: string }> = (props) => {
  const appRt = React.useContext(RuntimeContext)

  // The reference to the canvas, so the chart has something to draw on
  const chartRef = React.createRef<HTMLCanvasElement>()

  const [chartData, setChartData] = React.useState<TSData>(HashMap.empty)

  // derive a label from a time series key
  const label = (tsKey: TimeSeries.TimeSeriesKey) => {
    const mbSub = Option.map((s) => `-${s}`)(tsKey.subKey)
    return `${keyAsString(tsKey.key.key)}${Option.getOrElse(() => "")(mbSub)}`
  }

  // The callback that will handle incoming updates to the graph data
  const updateState = (newData: GraphDataService.GraphData) => {
    setChartData((current) => {
      return HashMap.reduceWithIndex(
        newData,
        HashMap.empty(),
        (
          s: TSData,
          v: Chunk.Chunk<TimeSeries.TimeSeriesEntry>,
          k: TimeSeries.TimeSeriesKey
        ) => {
          // TODO: Tap into the DashboardConfigService to retrieve the TSConfig
          const mbConfig = Option.map<LineData, TimeSeries.TimeSeriesConfig>(
            (d) => d.tsConfig
          )(HashMap.get(current, k))

          const cfg = Option.getOrElse(
            () => new TimeSeries.TimeSeriesConfig(k, label(k))
          )(mbConfig)

          const cData = {
            tsConfig: cfg,
            data: Chunk.map(v, (e) => {
              return { x: e.when, y: e.value }
            }),
          } as LineData

          return HashMap.set(k, cData)(s)
        }
      )
    })
  }

  React.useEffect(() => {
    const createUpdater = Effect.gen(function* ($) {
      const gdm = yield* $(GraphDataManager.GraphDataManager)
      const gds = yield* $(gdm.lookup(props.id))
      const data = yield* $(gds.current())
      updateState(data)

      const updates = yield* $(gds.data())

      const updater = yield* $(
        Effect.forkDaemon(
          Stream.runForEach((e: GraphDataService.GraphData) =>
            Effect.try(() => updateState(e))
          )(updates)
        )
      )

      return updater
    })

    const f = Runtime.runSync(appRt)(createUpdater)

    return () => {
      Runtime.runPromise(appRt)(Fiber.interrupt(f)).then((_) => {
        // ignore
      })
    }
  }, [])

  const chartDataSets = (() => {
    const ds = HashMap.values(
      HashMap.map(chartData, (cd) => {
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
