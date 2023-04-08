import * as HS from "@effect/data/HashSet"
import {
  Container,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import React from "react"

import * as MK from "@core/metrics/model/zio/metrics/MetricKey"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableMetricKeysProps {
  available: HS.HashSet<MK.InsightKey>
  // The initially selected keys
  selection: HS.HashSet<MK.InsightKey>
  // a Callback that can be used to change the selection state
  onSelect: (key: MK.InsightKey) => void
}

export const TableMetricKeys: React.FC<TableMetricKeysProps> = (props) => {
  const sorted = [...props.available].sort((a, b) => MK.OrdInsightKey.compare(a, b))

  const isSelected = (k: MK.InsightKey) => (selection: HS.HashSet<MK.InsightKey>) => {
    return HS.some(selection, (e) => e.id == k.id)
  }

  return (
    <Container>
      <TableContainer>
        <TableHead>
          <TableRow>
            <TableCell>Metric Type</TableCell>
            <TableCell>Name</TableCell>
            <TableCell>Labels</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sorted.map((k) => (
            <RowMetricKey
              key={k.id}
              metricKey={k}
              checked={isSelected(k)(props.selection)}
              toggled={() => props.onSelect(k)}
            />
          ))}
        </TableBody>
      </TableContainer>
    </Container>
  )
}

interface RowMetricKeyProps {
  metricKey: MK.InsightKey
  checked: boolean
  toggled: (k: MK.InsightKey) => void
}

const RowMetricKey: React.FC<RowMetricKeyProps> = (props) => (
  <TableRow>
    <TableCell>{props.metricKey.key.metricType}</TableCell>
    <TableCell>{props.metricKey.key.name}</TableCell>
    <TableCell>
      {props.metricKey.key.labels.map((l) => (
        <span className="badge" key={l.key}>
          {l.key}={l.value}
        </span>
      ))}
    </TableCell>
  </TableRow>
)
