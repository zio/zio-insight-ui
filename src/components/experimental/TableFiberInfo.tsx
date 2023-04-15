import { useInsightTheme } from "@components/theme/InsightTheme"
import {
  Box,
  Checkbox,
  Chip,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import React from "react"

import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import type { FiberFilterParams } from "./FiberFilter"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableFiberInfoProps {
  available: FiberInfo.FiberInfo[]
  // The initially selected keys
  filter: FiberFilterParams
  onRootSelect: (_: FiberInfo.FiberInfo, selected: boolean) => void
}

export const TableFiberInfo: React.FC<TableFiberInfoProps> = (props) => {
  const theme = useInsightTheme()
  // A simple sort function for the fiber ids
  const sorted = [...props.available].sort((a, b) =>
    FiberId.OrdFiberId.compare(a.id, b.id)
  )

  // A function that checks if a key is selected
  const isSelected = (k: FiberId.FiberId) => (filter: FiberFilterParams) => {
    return filter.root !== undefined && k.id == filter.root.id.id
  }

  return (
    <Box
      sx={{
        px: theme.pxPadding.medium,
        flex: "1 1 auto",
        overflow: "auto",
      }}
    >
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>
                <Chip label={`${props.available.length}`} color="secondary" />
              </TableCell>
              <TableCell>FiberId</TableCell>
              <TableCell>Started At</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Pin</TableCell>
              <TableCell>Trace</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sorted.map((k) => (
              <RowMetricKey
                key={k.id.id}
                fiber={k}
                checked={isSelected(k.id)(props.filter)}
                onChecked={(f, c) => props.onRootSelect(f, c)}
              />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  )
}

interface RowFiberIdProps {
  fiber: FiberInfo.FiberInfo
  checked: boolean
  onChecked: (_: FiberInfo.FiberInfo, selected: boolean) => void
}

const RowMetricKey: React.FC<RowFiberIdProps> = (props) => {
  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={props.checked}
          onChange={(evt, c) => props.onChecked(props.fiber, c)}
        />
      </TableCell>
      <TableCell>{props.fiber.id.id}</TableCell>
      <TableCell>{FiberId.formatDate(props.fiber.id)}</TableCell>
      <TableCell>{FiberId.formatLocation(props.fiber.id)}</TableCell>
      <TableCell>
        <Switch />
      </TableCell>
      <TableCell>
        <Switch />
      </TableCell>
    </TableRow>
  )
}
