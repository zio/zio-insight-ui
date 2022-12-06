import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"
import { Scrollable } from "./Scrollable"

export const ChartConfig: React.FC<{ id: string }> = (props) => {
  return (
    <div className="w-full h-full flex flex-col justify-items-stretch">
      <Scrollable>
        <TableMetricKeys
          initialSelection={[]}
          onSelectionChanged={() => {}}></TableMetricKeys>
      </Scrollable>
      <div className="m-2 flex-none flex flex-row justify-end">
        <span className="btn btn-neutral">Discard Changes</span>
        <span className="ml-2 btn btn-primary">Apply Changes</span>
      </div>
    </div>
  )
}
