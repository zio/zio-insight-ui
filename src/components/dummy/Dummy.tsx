import { ContentBox, ContentPanel } from "@components/contentbox/Content"
import { Typography } from "@mui/material"
import * as React from "react"

export const Dummy: React.FC<{ title: string }> = (props) => {
  return (
    <ContentBox>
      <ContentPanel>
        <Typography variant="h4">{props.title}</Typography>
      </ContentPanel>
    </ContentBox>
  )
}
