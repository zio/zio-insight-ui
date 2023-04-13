import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Paper, Typography } from "@mui/material"
import * as React from "react"

export const StackTrace: React.FC<{}> = (props) => {
  const theme = useInsightTheme()

  return (
    <ContentBox>
      <Box
        component={Paper}
        sx={{
          padding: `${theme.padding.medium}px`,
          display: "flex",
          flexGrow: 1,
        }}
      >
        <Typography variant="h6">StackTrace</Typography>
      </Box>
    </ContentBox>
  )
}
