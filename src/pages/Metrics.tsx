import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"

export function Metrics() {
  return (
    <div className="w-full flex place-content-center overflow-y-auto">
      <TableMetricKeys initialSelection={[]} onSelectionChanged={() => {}} />
    </div>
  )
}
