import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import * as HashSet from "@effect/data/HashSet"
import {
  Box,
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material"
import * as dateFns from "date-fns"
import React from "react"

import * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import { FilterField } from "@components/filterfield /FilterField"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableFiberInfoProps {
  available: HashSet.HashSet<FiberInfo.FiberInfo>
  // The initially selected keys
  selection: HashSet.HashSet<FiberId.FiberId>
  // a Callback that can be used to change the selection state
  onSelect: (key: FiberId.FiberId) => void
}

export const TableFiberInfo: React.FC<TableFiberInfoProps> = (props) => {
  const theme = useInsightTheme()
  // A simple sort function for the fiber ids
  const sorted = [...props.available].sort((a, b) => FiberId.OrdFiberId.compare(a.id, b.id))

  // A function that checks if a key is selected
  const isSelected =
    (k: FiberId.FiberId) => (selection: HashSet.HashSet<FiberId.FiberId>) => {
      return HashSet.some(selection, (e) => e.id == k.id)
    }

  const [activeOnly, setActiveOnly] = React.useState<boolean>(false)
  const toggleActiveOnly = () => setActiveOnly(!activeOnly)

  const [fiberFilter, setFiberFilter] = React.useState<string[]>([])

  return (
    <ContentBox>
      <Box component={Paper} sx={{
        display: 'flex',
        flexDirection: 'row',
        padding: `${theme.padding.medium}px`
      }}>
        <FormControlLabel 
          label="Active only" 
          control={
            <Switch 
              onChange={toggleActiveOnly} 
              checked={activeOnly} 
             color="secondary"/>
          } 
          sx={{
          flexGrow: 0
          }}></FormControlLabel>
        <FilterField onFilterChange={(words : string[]) => setFiberFilter(words)} sx={{ 
          width: "100%"
        }}/>
      </Box>
      <Box
        sx={{
          mt: `${theme.padding.medium}px`,
          flex: "1 1 auto",
          overflow: "auto",
        }}
      >
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead>
              <TableRow>
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
                  checked={isSelected(k.id)(props.selection)}
                  toggled={() => props.onSelect(k.id)}
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
  fiber: FiberInfo.FiberInfo
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
      <TableCell>{props.fiber.id.id}</TableCell>
      <TableCell>{toDate(props.fiber.id.startTimeMillis)}</TableCell>
      <TableCell>{FiberId.formatLocation(props.fiber.id.location)}</TableCell>
      <TableCell><Switch /></TableCell>
      <TableCell><Switch /></TableCell>
    </TableRow>
  )
}
