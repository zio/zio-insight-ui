import * as React from "react"
import { Layout, Responsive, WidthProvider } from "react-grid-layout"

import "@styles/grid.css"

export function MyGrid() {
  const layout: Layout[] = [
    { i: "a", x: 0, y: 0, w: 1, h: 1 },
    { i: "b", x: 1, y: 0, w: 2, h: 2, minW: 2, maxW: 4 },
    { i: "c", x: 0, y: 1, w: 1, h: 2 }
  ]

  const elems: string[] = ["a", "b", "c"]

  const ResponsiveGridLayout = WidthProvider(Responsive)

  return (
    <ResponsiveGridLayout
      className="layout"
      layouts={{ lg: layout }}
      cols={{ lg: 12 }}
      rowHeight={100}
      width={1000}>
      {elems.map((s: string) => (
        <div
          key={s}
          className="w-full h-full bg-slate-100 p-2 rounded-md border-2 border-slate-900">
          {s}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
