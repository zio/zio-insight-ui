import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box } from "@mui/material"
import type { BoxProps } from "@mui/material"
import * as React from "react"

export const ContentBox: React.FC<BoxProps> = (props) => {
  const theme = useInsightTheme()

  return (
    <Box
      {...props}
      sx={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        margin: "0px",
        padding: `${theme.padding.medium}px`,
        backgroundColor: theme.palette.primary.light,
        ...props.sx,
      }}
    />
  )
}
