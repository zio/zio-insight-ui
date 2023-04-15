import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Button, Paper, Typography } from "@mui/material"
import * as React from "react"

import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type { FiberInfo } from "@core/metrics/model/insight/fibers/FiberInfo"

export const SelectedRoot: React.FC<{ fiber: FiberInfo; onClear: () => void }> = (
  props
) => {
  const display = (s: string) => {
    return (
      <Typography
        variant="h6"
        sx={{
          mx: 1,
        }}
      >
        {s}
      </Typography>
    )
  }

  const theme = useInsightTheme()
  return (
    <Box
      component={Paper}
      sx={{
        display: "flex",
        flexDirection: "row",
        mt: theme.pxPadding.medium,
        padding: theme.pxPadding.medium,
      }}
    >
      <Button variant="contained" color="secondary" onClick={props.onClear}>
        Clear Root
      </Button>
      {display("Selected Root:")}
      {display(`${props.fiber.id.id}`)}
      {display(FiberId.formatDate(props.fiber.id))}
      {display(FiberId.formatLocation(props.fiber.id.location))}
    </Box>
  )
}
