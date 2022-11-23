import * as T from "@effect/core/io/Effect"
import * as React from "react"
import { Layout, Responsive, WidthProvider } from "react-grid-layout"
import * as App from "@components/App"
import "@styles/grid.css"
import { ChartContainer } from "./panel/ChartPanel"
import { GridFrame } from "./panel/GridFrame"
import * as TK from "@data/testkeys"
import { pipe } from "@tsplus/stdlib/data/Function"
import { InsightKey } from "@core/metrics/model/zio/MetricKey"

export function InsightGridLayout() {
  const appRt = React.useContext(App.RuntimeContext)

  const keys = appRt.unsafeRunSync(
    pipe(
      TK.summaryKey,
      T.zip(TK.gaugeKey),
      T.catchAll((_) => T.sync(() => [] as InsightKey[]))
    )
  )

  const [layout, _] = React.useState<[Layout, React.ReactElement][]>([
    [
      { i: "a", x: 0, y: 0, w: 12, h: 7 },
      <GridFrame key="a">
        <ChartContainer metricKey={keys[0]} />
      </GridFrame>
    ],
    [
      { i: "b", x: 0, y: 0, w: 12, h: 7 },
      <GridFrame key="b">
        <ChartContainer metricKey={keys[1]} />
      </GridFrame>
    ]
  ])

  const ResponsiveGridLayout = WidthProvider(Responsive)

  // This is required to push resize events, so that embedded Vega Lite charts
  // trigger their own resizing as well
  const handleResize = () => window.dispatchEvent(new Event("resize"))

  return (
    <ResponsiveGridLayout
      className="layout w-full h-full"
      compactType="horizontal"
      layouts={{ md: layout.map((el) => el[0]), lg: layout.map((el) => el[0]) }}
      cols={{ md: 8, lg: 12 }}
      onResize={handleResize}
      onResizeStop={() => setTimeout(handleResize, 200)}
      rowHeight={50}>
      {layout.map((l) => (
        <div key={l[0].i} className="w-full h-full bg-neutral text-neutral-content">
          {l[1]}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
