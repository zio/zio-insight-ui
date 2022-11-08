import { MyGrid } from "@components/Grid"
import { MetricKeySelector } from "@components/TableMetricKey"
import * as React from "react"

export function Metrics() {
  return (
    <div className="w-full h-full flex flex-col">
      <div className="flex flex-row">
        <MetricKeySelector />
      </div>
      <div className="w-full h-full flex flex-grow">
        <MyGrid />
      </div>
    </div>
  )
}
