import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"

export function Metrics() {
  return (
    <div className="w-full h-full flex flex-grow">
      <TableMetricKeys initialSelection={[]} onSelectionChanged={() => {}} />
    </div>
  )
}
