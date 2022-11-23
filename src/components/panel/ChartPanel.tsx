import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as F from "@effect/core/io/Fiber"
import * as React from "react"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import { RuntimeContext } from "@components/App"
import * as GDS from "@core/metrics/service/GraphDataService"
import * as TK from "@data/testkeys"
import { Chart } from "chart.js/auto"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as Color from "@core/Color"

// required import for time based axis
import "chartjs-adapter-date-fns"

interface ChartData {
  label: string
  data: { x: Date; y: number }[]
  tension: number
  lineColor: Color.Color
  pointColor: Color.Color
}

const lineColor = Color.fromRandom()
const pointColor = Color.fromRandom()

export const ChartContainer: React.FC<{}> = () => {
  const [graphData, setGraphData] = React.useState<ChartData[]>([])
  const appRt = React.useContext(RuntimeContext)

  const toData = (d: GDS.GraphData) =>
    Coll.toArray(
      HMap.values(
        HMap.mapWithIndex((k: TS.TimeSeriesKey, v: C.Chunk<TS.TimeSeriesEntry>) => {
          return {
            label: k,
            data: Coll.toArray(v).map((e) => {
              return { x: e.when, y: e.value }
            }),
            tension: 0.5,
            lineColor: lineColor,
            pointColor: pointColor
          } as ChartData
        })(d)
      )
    )

  const updateState = (newData: ChartData[]) => {
    setGraphData((_) => {
      return newData
    })
  }

  React.useEffect(() => {
    const [gds, updater] = appRt.unsafeRunSync(
      T.gen(function* ($) {
        const gds = yield* $(GDS.createGraphDataService())
        const k = yield* $(TK.gaugeKey)
        yield* $(gds.setMetrics(k))
        yield* $(gds.setMaxEntries(20))

        const updates = yield* $(gds.data())

        const updater = yield* $(
          pipe(
            S.runForEach((e: GDS.GraphData) =>
              T.sync(() => {
                updateState(toData(e))
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
      <ChartPanel initialData={graphData} />
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
              label: cd.label,
              data: cd.data,
              tension: cd.tension,
              backgroundColor: cd.pointColor.toRgb(),
              borderColor: cd.lineColor.toRgba()
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
