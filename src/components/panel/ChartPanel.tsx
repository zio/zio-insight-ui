import * as T from "@effect/core/io/Effect"
import * as React from "react"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import { RuntimeContext } from "@components/App"
import * as GDS from "@core/metrics/service/GraphDataService"
import * as TK from "@data/testkeys"
import { Chart } from "chart.js/auto"

// required import for time based axis
import "chartjs-adapter-date-fns"

const now = new Date().getTime()

const createTS = (id: string) =>
  [...Array(5).keys()].map(
    (i) =>
      ({
        id: id,
        when: new Date(now - i * 120000),
        value: Math.floor(Math.random() * 1000)
      } as TS.TimeSeriesEntry)
  )

const data = [...Array(3).keys()].map((i) => {
  return { title: `Test ${i}`, data: createTS(`ref${i}`) }
})

export const ChartPanel: React.FC<{}> = () => {
  const appRt = React.useContext(RuntimeContext)

  const chartRef = React.createRef<HTMLCanvasElement>()
  React.useEffect(() => {
    if (chartRef) {
      const gds = appRt.unsafeRunSync(
        T.gen(function* ($) {
          const gds = yield* $(GDS.createGraphDataService())
          const ck = yield* $(TK.counterKey)
          yield* $(gds.setMetrics(ck))
          return gds
        })
      )
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
          datasets: data.map((ds) => {
            return {
              label: ds.title,
              data: ds.data.map((e) => {
                return { x: e.when, y: e.value }
              }),
              tension: 0.3
            }
          })
        }
      })

      return () => {
        chart.destroy()
        try {
          appRt.unsafeRunSync(gds.close())
        } catch {}
      }
    }
  }, [])

  return (
    <div className="w-full h-full">
      <canvas className="bg-neutral-content" ref={chartRef} />
    </div>
  )
}
