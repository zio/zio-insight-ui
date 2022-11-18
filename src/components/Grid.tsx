import * as React from "react"
import { Layout, Responsive, WidthProvider } from "react-grid-layout"

import "@styles/grid.css"
import { VegaPanel } from "./panel/VegaPanel"
import { GridFrame } from "./panel/GridFrame"

export function MyGrid() {
  const [layout, _] = React.useState<Layout[]>([
    { i: "a", x: 0, y: 0, w: 3, h: 3 },
    { i: "b", x: 0, y: 0, w: 3, h: 3 },
    { i: "c", x: 0, y: 0, w: 3, h: 3 },
    { i: "d", x: 0, y: 0, w: 3, h: 3 }
  ])

  const ResponsiveGridLayout = WidthProvider(Responsive)

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
        <div key={l.i} className="w-full h-full pl-4 bg-neutral text-neutral-content">
          <GridFrame key={l.i}>
            <VegaPanel />
          </GridFrame>
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
