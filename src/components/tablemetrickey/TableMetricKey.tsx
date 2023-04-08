import { ContentBox } from "@components/contentbox/ContentBox"
import * as HS from "@effect/data/HashSet"
import {
  Chip,
  Paper,
  Table,
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
    <ContentBox>
      <TableContainer>
        <Table component={Paper}>
          <TableHead>
            <TableRow>
              <TableCell></TableCell>
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
        </Table>
      </TableContainer>
    </ContentBox>
  )
}

interface RowMetricKeyProps {
  metricKey: MK.InsightKey
  checked: boolean
  toggled: (k: MK.InsightKey) => void
}

const RowMetricKey: React.FC<RowMetricKeyProps> = (props) => (
  <TableRow>
    <TableCell>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={() => {
          props.toggled(props.metricKey)
        }}
      ></input>
    </TableCell>
    <TableCell>{props.metricKey.key.metricType}</TableCell>
    <TableCell>{props.metricKey.key.name}</TableCell>
    <TableCell>
      {props.metricKey.key.labels.map((l) => (
        <Chip
          label={`${l.key}=${l.value}`}
          color="primary"
          variant="outlined"
          sx={{
            mx: "2px",
          }}
        />
      ))}
    </TableCell>
  </TableRow>
)
