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
          padding: `${theme.padding.medium}px`,
          borderRadius: `${theme.padding.xsmall}px`,
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Typography variant="h4">{props.title}</Typography>
      </Box>
    </ContentBox>
  )
}
