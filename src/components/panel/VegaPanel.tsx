import * as React from "react"
import embed from "vega-embed"
import { TopLevelSpec } from "vega-lite"
import * as TS from "@core/metrics/model/insight/TimeSeries"

const now = new Date().getTime()

const createTS = (id: string) =>
  [...Array(10).keys()].map(
    (i) =>
      ({
        id: id,
        when: new Date(now - (10 + i) * 30000),
        value: Math.floor(Math.random() * 10) * 10
      } as TS.TimeSeriesEntry)
  )

const data = createTS("ref1")
data.push(...createTS("ref2"))
data.push(...createTS("ref3"))

export const VegaPanel: React.FC<{}> = () => {
  const myRef = React.createRef<HTMLDivElement>()

  const vegaLiteSpec: TopLevelSpec = {
    $schema: "https://vega.github.io/schema/vega-lite/v5.json",
    padding: 5,
    params: [
      {
        name: "labels",
        value: {
          ref1: "Gauge 1",
          ref2: "Gauge 2",
          ref3: "Gauge 3"
        }
      }
    ],
    data: {
      values: data
    },
    mark: {
      type: "line",
      interpolate: "monotone",
      tension: 1,
      strokeWidth: 1,
      color: "gray",
      point: {
        tooltip: true,
        filled: false,
        fill: "#fff"
      }
    },
    encoding: {
      x: { field: "when", type: "temporal", title: "T" },
      y: { field: "value", type: "quantitative", title: "V" },
      color: {
        field: "id",
        type: "nominal",
        scale: {
          range: ["gray", "orange", "blue"]
        },
        legend: {
          title: "Test",
          labelExpr: "labels[datum.value]"
        }
      }
    },
    width: "container",
    height: "container",
    config: {
      axis: {
        titleColor: "#fff",
        labelColor: "#fff",
        grid: false
      },
      background: "#505266"
    }
  }

  React.useEffect(() => {
    embed(myRef.current!, vegaLiteSpec, { actions: true, renderer: "svg" })
  }, [])

  return <div ref={myRef} className="w-full h-full"></div>
}
