import { ContentBox } from "@components/contentbox/ContentBox"
import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Paper, Typography } from "@mui/material"
import * as React from "react"

import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

export interface StackTraceProps {
  fibers: FiberInfo.FiberInfo[]
}

export const StackTrace: React.FC<StackTraceProps> = (props) => {
  const theme = useInsightTheme()

  return (
    <ContentBox>
      <Box
        component={Paper}
        sx={{
          padding: theme.pxPadding.medium,
          display: "flex",
          flexGrow: 1,
        }}
      >
        {props.fibers.map((fiber) => {
          return <SingleTrace key={`fiber-${fiber.id.id}`} fiber={fiber} />
        })}
      </Box>
    </ContentBox>
  )
}

const SingleTrace: React.FC<{
  fiber: FiberInfo.FiberInfo
}> = (props) => {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
          flexGrow: 0,
        }}
      >
        <Typography>
          {props.fiber.id.id} -- {FiberId.formatDate(props.fiber.id)} --{" "}
          {FiberId.formatLocation(props.fiber.id.location)}
        </Typography>
        {props.fiber.stacktrace === undefined ? (
          <Typography color="error">"No stacktrace" </Typography>
        ) : (
          props.fiber.stacktrace.map((frame) => {
            return <Typography>{FiberId.formatLocation(frame)}</Typography>
          })
        )}
      </Box>
    </Box>
  )
}
