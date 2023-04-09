import { ContentBox } from "@components/contentbox/ContentBox"
import { Box, Typography } from "@mui/material"
import * as React from "react"

export const Dummy: React.FC<{ title: string }> = (props) => {
  return (
    <ContentBox>
      <Box>
        <Typography variant="h4">{props.title}</Typography>
      </Box>
    </ContentBox>
  )
}
