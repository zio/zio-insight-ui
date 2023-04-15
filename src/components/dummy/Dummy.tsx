import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Typography } from "@mui/material"
import * as React from "react"

export const Dummy: React.FC<{ title: string }> = (props) => {
  const theme = useInsightTheme()

  return (
    <ContentBox>
      <Box
        sx={{
          padding: theme.pxPadding.medium,
          borderRadius: theme.pxPadding.xsmall,
          backgroundColor: theme.theme.palette.background.default,
        }}
      >
        <Typography variant="h4">{props.title}</Typography>
      </Box>
    </ContentBox>
  )
}
