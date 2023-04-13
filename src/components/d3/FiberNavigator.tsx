import { RuntimeContext } from "@components/app/App"
import { ContentBox } from "@components/contentbox/ContentBox"
import { StackTrace } from "@components/stacktrace/StackTrace"
import { TableFiberInfo } from "@components/d3/TableFiberInfo"
import * as HashSet from "@effect/data/HashSet"
import * as Runtime from "@effect/io/Runtime"
import { Box } from "@mui/material"
import * as React from "react"
import * as FiberFilter from "./FiberFilter"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import { FiberForceGraph } from "./FiberForceGraph"
import * as FiberDataConsumer from "./FiberDataConsumer"
import { useInsightTheme } from "@components/theme/InsightTheme"

export const FiberNavigator: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const fiberConsumer = React.useRef<FiberDataConsumer.FiberUpdater | undefined>(undefined)

  const theme = useInsightTheme()

  const [fibers, setFibers] = React.useState<FiberInfo.FiberInfo[]>([])

  const [fiberFilter, setFiberFilter] = React.useState<FiberFilter.FiberFilterParams>({
    activeOnly: false,
    filterWords: [],
    matchWords: true,
    root: undefined,
    selected: HashSet.empty(),
    pinned: HashSet.empty(),
    traced: HashSet.empty()
  })

  const rootSelected = (f: FiberInfo.FiberInfo, sel: boolean) => {
    setFiberFilter({
      ...fiberFilter,
      root: sel ? f : undefined
    })
  }

  const clearUpdater = () => { 
    if (fiberConsumer.current !== undefined) { 
      Runtime.runSync(appRt)(fiberConsumer.current.fds.removeSubscription(fiberConsumer.current.id))
    } 
    fiberConsumer.current = undefined
  }

  React.useEffect(() => {
    clearUpdater()
    fiberConsumer.current = FiberDataConsumer.createFiberUpdater(
      appRt,
      (infos: FiberInfo.FiberInfo[]) => {
        const filtered = infos.filter(f => FiberFilter.matchFiber(fiberFilter)(f))
        setFibers(filtered)
      }
    )

    return () => {
      clearUpdater()
    }
  }, [appRt, fiberFilter])

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        width: "100%",
        height: "100%",
        position: "relative",
      }}
    >
      <Box
        sx={{
          width: "50%",
          height: "100%",
          display: "flex",
        }}
      >
        <ContentBox>
          <FiberForceGraph filter={{
            ...fiberFilter,
            matchWords: false
          }} />
        </ContentBox>
      </Box>
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "50%",
          }}
        >
          <Box sx={{
            padding: `${theme.padding.medium}px`
          }}>
            <FiberFilter.FiberFilter filter={fiberFilter} onFilterChange={setFiberFilter}></FiberFilter.FiberFilter>
          </Box>
          <TableFiberInfo
            available={fibers}
            filter={fiberFilter}
            onRootSelect={rootSelected}
          ></TableFiberInfo>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <StackTrace />
        </Box>
      </Box>
    </Box>
  )
}
