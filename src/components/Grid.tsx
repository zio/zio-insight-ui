import * as React from "react"
import { Layout, Responsive, WidthProvider } from "react-grid-layout"

import "@styles/grid.css"
import { ChartContainer } from "./panel/ChartPanel"
import { GridFrame } from "./panel/GridFrame"

export function InsightGridLayout() {
  const [layout, _] = React.useState<Layout[]>([
    { i: "a", x: 0, y: 0, w: 3, h: 3 },
    { i: "b", x: 0, y: 0, w: 3, h: 3 },
    { i: "c", x: 0, y: 0, w: 3, h: 3 },
    { i: "d", x: 0, y: 0, w: 3, h: 3 }
  ])

  const ResponsiveGridLayout = WidthProvider(Responsive)

  // This is required to push resize events, so that embedded Vega Lite charts
  // trigger their own resizing as well
  const handleResize = () => window.dispatchEvent(new Event("resize"))

  return (
    <ResponsiveGridLayout
      className="layout w-full h-full"
      compactType="horizontal"
      layouts={{ md: layout, lg: layout }}
      cols={{ md: 8, lg: 12 }}
      onResize={handleResize}
      onResizeStop={() => setTimeout(handleResize, 200)}
      rowHeight={50}>
      {layout.map((l: Layout) => (
        <div key={l.i} className="w-full h-full bg-neutral text-neutral-content">
          <GridFrame key={l.i}>
            <ChartContainer />
          </GridFrame>
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
