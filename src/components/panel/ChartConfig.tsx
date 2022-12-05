import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"

export const ChartConfig: React.FC<{ id: string }> = (props) => {
  return (
    <div className="w-full h-full flex flex-col justify-items-stretch">
      <div className="grow w-full place-items-stretch relative">
        <div className="absolute top-0 left-0 w-full h-full overflow-y-auto">
          <TableMetricKeys
            initialSelection={[]}
            onSelectionChanged={() => {}}></TableMetricKeys>
        </div>
      </div>
      <div className="m-2 flex-none flex flex-row justify-end">
        <span className="btn btn-neutral">Discard Changes</span>
        <span className="ml-2 btn btn-primary">Apply Changes</span>
      </div>
    </div>
  )
}
