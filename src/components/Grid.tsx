import * as React from "react"
import { Layout, Responsive, WidthProvider } from "react-grid-layout"

import "@styles/grid.css"

export function MyGrid() {
  const layout: Layout[] = [
    { i: "a", x: 0, y: 0, w: 1, h: 2 },
    { i: "b", x: 1, y: 0, w: 2, h: 2 },
    { i: "c", x: 0, y: 1, w: 1, h: 2 }
  ]

  const elements: string[] = ["a", "b", "c"]

  const ResponsiveGridLayout = WidthProvider(Responsive)

  return (
    <ResponsiveGridLayout
      className="layout w-full h-full"
      compactType="horizontal"
      layouts={{ lg: layout }}
      cols={{ lg: 12 }}
      rowHeight={100}
      width={1000}>
      {elements.map((s: string) => (
        <div
          key={s}
          className="w-full h-full bg-yellow-200 p-2 rounded-md border-2 border-slate-600">
          {s}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
