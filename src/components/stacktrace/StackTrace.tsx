import { ContentBox } from "@components/contentbox/ContentBox"
import { Box, Paper, Typography } from "@mui/material"
import * as React from "react"

export const StackTrace: React.FC<{}> = (props) => {
  return (
    <ContentBox>
      <Box
        component={Paper}
        sx={{
          display: "flex",
          flexGrow: 1,
        }}
      >
        <Typography variant="h6">StackTrace</Typography>
      </Box>
    </ContentBox>
  )
}
