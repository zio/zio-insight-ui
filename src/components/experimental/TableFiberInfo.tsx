import { useInsightTheme } from "@components/theme/InsightTheme"
import * as HashSet from "@effect/data/HashSet"
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
  onTrace: (_: FiberInfo.FiberInfo, selected: boolean) => void
  onPin: (_: FiberInfo.FiberInfo, selected: boolean) => void
}

export const TableFiberInfo: React.FC<TableFiberInfoProps> = (props) => {
  const theme = useInsightTheme()
  // A simple sort function for the fiber ids
  const sorted = [...props.available].sort((a, b) =>
    FiberId.OrdFiberId.compare(a.id, b.id)
  )

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
                filter={props.filter}
                onChecked={(f, c) => props.onRootSelect(f, c)}
                onTrace={(f, c) => props.onTrace(f, c)}
                onPin={(f, c) => props.onPin(f, c)}
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
  filter: FiberFilterParams
  onChecked: (_: FiberInfo.FiberInfo, selected: boolean) => void
  onTrace: (_: FiberInfo.FiberInfo, selected: boolean) => void
  onPin: (_: FiberInfo.FiberInfo, selected: boolean) => void
}

const RowMetricKey: React.FC<RowFiberIdProps> = (props) => {
  const rootChecked: boolean =
    props.filter.root === undefined
      ? false
      : props.filter.root.id.id == props.fiber.id.id

  return (
    <TableRow>
      <TableCell>
        <Checkbox
          checked={rootChecked}
          onChange={(_, c) => props.onChecked(props.fiber, c)}
        />
      </TableCell>
      <TableCell>{props.fiber.id.id}</TableCell>
      <TableCell>{FiberId.formatDate(props.fiber.id)}</TableCell>
      <TableCell>{FiberId.formatLocation(props.fiber.id.location)}</TableCell>
      <TableCell>
        <Switch
          color="secondary"
          checked={HashSet.has(props.filter.pinned, props.fiber.id.id)}
          onChange={(_, c) => props.onPin(props.fiber, c)}
        />
      </TableCell>
      <TableCell>
        <Switch
          color="secondary"
          checked={HashSet.has(props.filter.traced, props.fiber.id.id)}
          onChange={(_, c) => props.onTrace(props.fiber, c)}
        />
      </TableCell>
    </TableRow>
  )
}
