import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"

export const ChartConfig: React.FC<{ id: string }> = (props) => {
  return (
    <div className="flex flex-col">
      <div className="flex-none flex flex-row">xx</div>
      <div className="grow grid grid-col-1 place-items-stretch">
        <div className="h-max-full w-full overflow-hidden">
          <TableMetricKeys initialSelection={[]} onSelectionChanged={() => {}} />
        </div>
      </div>
      <div className="m-2 flex-none flex flex-row justify-end">
        <span className="btn btn-neutral">Discard Changes</span>
        <span className="ml-2 btn btn-primary">Apply Changes</span>
      </div>
    </div>
  )
}
