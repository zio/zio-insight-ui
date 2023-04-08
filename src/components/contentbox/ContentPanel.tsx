import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Paper } from "@mui/material"
import * as React from "react"

export const ContentPanel: React.FC<React.PropsWithChildren> = (props) => {
  const theme = useInsightTheme()

  return (
    <Paper
      sx={{
        padding: `${theme.padding.panel}px`,
      }}
    >
      {props.children}
    </Paper>
  )
}
