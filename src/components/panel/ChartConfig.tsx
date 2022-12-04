import * as React from "react"
import { TableMetricKeys } from "@components/TableMetricKey"

export const ChartConfig: React.FC<{ id: string }> = (props) => {
  return <TableMetricKeys initialSelection={[]} onSelectionChanged={() => {}} />
}
