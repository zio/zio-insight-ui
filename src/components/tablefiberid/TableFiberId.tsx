import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import * as HS from "@effect/data/HashSet"
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import * as dateFns from "date-fns"
import React from "react"

import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableFiberIdProps {
  available: HS.HashSet<FiberId.FiberId>
  // The initially selected keys
  selection: HS.HashSet<FiberId.FiberId>
  // a Callback that can be used to change the selection state
  onSelect: (key: FiberId.FiberId) => void
}

export const TableFiberIds: React.FC<TableFiberIdProps> = (props) => {
  const theme = useInsightTheme()
  // A simple sort function for the fiber ids
  const sorted = [...props.available].sort((a, b) => FiberId.OrdFiberId.compare(a, b))

  // A function that checks if a key is selected
  const isSelected =
    (k: FiberId.FiberId) => (selection: HS.HashSet<FiberId.FiberId>) => {
      return HS.some(selection, (e) => e.id == k.id)
    }

  return (
    <ContentBox>
      <Box>
        <h2>Create a filter here</h2>
      </Box>
      <Box
        sx={{
          mt: `${theme.padding.medium}px`,
          flex: "1 1 auto",
          overflow: "auto",
        }}
      >
        <TableContainer>
          <Table component={Paper}>
            <TableHead>
              <TableRow>
                <TableCell>
                  <input type="checkbox"></input>
                </TableCell>
                <TableCell>FiberId</TableCell>
                <TableCell>Started At</TableCell>
                <TableCell>Location</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.map((k) => (
                <RowMetricKey
                  key={k.id}
                  fiberId={k}
                  checked={isSelected(k)(props.selection)}
                  toggled={() => props.onSelect(k)}
                />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>
    </ContentBox>
  )
}

interface RowFiberIdProps {
  fiberId: FiberId.FiberId
  checked: boolean
  toggled: (k: FiberId.FiberId) => void
}

const RowMetricKey: React.FC<RowFiberIdProps> = (props) => {
  const toDate = (millis: number) => {
    const d = new Date(millis)
    return dateFns.format(d, "yyyy-MM-dd HH:mm:ss")
  }

  return (
    <TableRow>
      <TableCell>
        <input
          type="checkbox"
          checked={props.checked}
          onChange={() => {
            props.toggled(props.fiberId)
          }}
        ></input>
      </TableCell>
      <TableCell>{props.fiberId.id}</TableCell>
      <TableCell>{toDate(props.fiberId.startTimeMillis)}</TableCell>
      <TableCell>{FiberId.formatLocation(props.fiberId.location)}</TableCell>
    </TableRow>
  )
}
