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
      layouts={{ md: layout, lg: layout }}
      cols={{ md: 8, lg: 12 }}
      rowHeight={50}>
      {elements.map((s: string) => (
        <div
          key={s}
          className="w-full h-full bg-neutral-content p-2 rounded-md border-2 border-base-200">
          {s}
        </div>
      ))}
    </ResponsiveGridLayout>
  )
}
