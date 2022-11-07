import { MyGrid } from "@components/Grid"
import * as React from "react"

export function Metrics() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="w-full h-full flex flex-grow">
        <MyGrid />
      </div>
    </div>
  )
}
