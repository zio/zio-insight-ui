import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import * as HS from "@effect/data/HashSet"
import {
  Box,
  Checkbox,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material"
import * as React from "react"

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
  const theme = useInsightTheme()
  const sorted = [...props.available].sort((a, b) => MK.OrdInsightKey.compare(a, b))

  const [keyFilter, setKeyFilter] = React.useState<string>("")

  const isSelected = (k: MK.InsightKey) => (selection: HS.HashSet<MK.InsightKey>) => {
    return HS.some(selection, (e) => e.id == k.id)
  }

  const tHead = (s: string) => (
    <TableCell>
      <Typography variant="h6">{s}</Typography>
    </TableCell>
  )

  const isIncluded = (k: MK.InsightKey) => {
    const sKey = MK.keyAsString(k.key)
    const words = keyFilter.split(/\s+/).filter((s) => s.trim().length > 0)
    const match = words.reduce<boolean>((acc, s) => acc && sKey.includes(s), true)

    return isSelected(k)(props.selection) || match
  }

  return (
    <ContentBox>
      <Box
        component={Paper}
        sx={{
          padding: `${theme.padding.medium}px`,
        }}
      >
        <TextField
          label={"Add a filter phrase"}
          onChange={(evt: React.ChangeEvent<HTMLInputElement>) => {
            setKeyFilter(evt.target.value)
          }}
          sx={{
            width: "100%",
          }}
        ></TextField>
      </Box>
      <Box
        sx={{
          mt: `${theme.padding.medium}px`,
          flex: "1 1 auto",
          overflow: "auto",
        }}
      >
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                {tHead("Metric Type")}
                {tHead("Name")}
                {tHead("Labels")}
              </TableRow>
            </TableHead>
            <TableBody>
              {sorted.filter(isIncluded).map((k) => (
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
      </Box>
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
      <Checkbox
        checked={props.checked}
        onChange={() => {
          props.toggled(props.metricKey)
        }}
      ></Checkbox>
    </TableCell>
    <TableCell>{props.metricKey.key.metricType}</TableCell>
    <TableCell>{props.metricKey.key.name}</TableCell>
    <TableCell>
      {props.metricKey.key.labels.map((l) => (
        <Chip
          key={l.key}
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
