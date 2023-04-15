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
          flexDirection: "column",
          flexGrow: 1,
          overflow: "auto",
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
  const theme = useInsightTheme()

  const rendertrace = (trace: FiberId.Location[]) => {
    return (
      <Box>
        {trace.map((loc) => {
          return <Typography>{FiberId.formatLocation(loc)}</Typography>
        })}
      </Box>
    )
  }

  return (
    <Box
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        component={Paper}
        sx={{
          padding: theme.pxPadding.medium,
          mb: theme.pxPadding.small,
          width: "100%",
        }}
      >
        {
          <Box
            sx={{
              borderRadius: theme.pxPadding.small,
              padding: theme.pxPadding.small,
              backgroundColor: theme.theme.palette.primary.main,
              color: theme.theme.palette.primary.contrastText,
            }}
          >
            <Typography variant="h6">
              {props.fiber.id.id} -- {FiberId.formatDate(props.fiber.id)} --{" "}
              {FiberId.formatLocation(props.fiber.id.location)}
            </Typography>
          </Box>
        }
        {props.fiber.stacktrace === undefined ? (
          <></>
        ) : (
          rendertrace(props.fiber.stacktrace)
        )}
      </Box>
    </Box>
  )
}
