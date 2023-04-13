import { FiberInfo } from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import { Box, Button, Paper, Typography } from "@mui/material"
import * as React from "react"
import { useInsightTheme } from "@components/theme/InsightTheme"

export const SelectedRoot : React.FC<{fiber: FiberInfo, onClear: () => void}> = (props) => {

  const display = (s: string) => {
    return (
      <Typography variant="h6" sx={{
        mx:1
      }}>{s}</Typography>
    )
  }

  const theme = useInsightTheme()
  return (
    <Box component={Paper} sx={{
      display: "flex",
      flexDirection: "row",
      mt:`${theme.padding.medium}px`,
      padding: `${theme.padding.medium}px`
    }}>
      <Button variant="contained" color="secondary" onClick={props.onClear}>Clear Root</Button>
      {display("Selected Root:")}
      {display(`${props.fiber.id.id}`)}
      {display(FiberId.formatDate(props.fiber.id))}
      {display(FiberId.formatLocation(props.fiber.id))}
    </Box>
  )
} 