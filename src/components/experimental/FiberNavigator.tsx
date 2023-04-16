import { RuntimeContext } from "@components/app/App"
import { ContentBox } from "@components/contentbox/ContentBox"
import { StackTrace } from "@components/experimental/StackTrace"
import { TableFiberInfo } from "@components/experimental/TableFiberInfo"
import { useInsightTheme } from "@components/theme/InsightTheme"
import { pipe } from "@effect/data/Function"
import * as HashSet from "@effect/data/HashSet"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import { Box } from "@mui/material"
import * as React from "react"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import type { FiberTraceRequest } from "@core/metrics/model/insight/fibers/FiberTraceRequest"
import * as FiberDataService from "@core/metrics/services/FiberDataService"

import * as FiberDataConsumer from "./FiberDataConsumer"
import * as FiberFilter from "./FiberFilter"
import { FiberForceGraph } from "./FiberForceGraph"

export const FiberNavigator: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const fiberConsumer = React.useRef<FiberDataConsumer.FiberUpdater | undefined>(
    undefined
  )

  const theme = useInsightTheme()

  const [fibers, setFibers] = React.useState<FiberInfo.FiberInfo[]>([])

  const [fiberFilter, setFiberFilter] = React.useState<FiberFilter.FiberFilterParams>({
    activeOnly: false,
    filterWords: [],
    matchWords: true,
    root: undefined,
    selected: HashSet.empty(),
    pinned: HashSet.empty(),
    traced: HashSet.empty(),
  })

  const tracedFibers = () => {
    const res = fibers.filter(
      (f) => f.stacktrace !== undefined && f.stacktrace.length > 0
    )
    return res
  }

  const updateFiberFilter = (f: FiberFilter.FiberFilterParams) => {
    Runtime.runSync(appRt)(
      Effect.gen(function* ($) {
        const fds = yield* $(FiberDataService.FiberDataService)
        const req: FiberTraceRequest = {
          root: f.root?.id.id,
          activeOnly: f.activeOnly,
          traced: [...f.traced],
        }
        yield* $(fds.setTraceRequest(req))
      })
    )
    setFiberFilter(f)
  }

  const onRootSelect = (f: FiberInfo.FiberInfo, sel: boolean) => {
    updateFiberFilter({
      ...fiberFilter,
      root: sel ? f : undefined,
    })
  }

  const onTrace = (f: FiberInfo.FiberInfo, sel: boolean) => {
    updateFiberFilter({
      ...fiberFilter,
      traced: sel
        ? HashSet.add(fiberFilter.traced, f.id.id)
        : HashSet.remove(fiberFilter.traced, f.id.id),
    })
  }

  const onPin = (f: FiberInfo.FiberInfo, sel: boolean) => {
    updateFiberFilter({
      ...fiberFilter,
      pinned: sel
        ? HashSet.add(fiberFilter.pinned, f.id.id)
        : HashSet.remove(fiberFilter.pinned, f.id.id),
    })
  }

  const clearUpdater = () => {
    if (fiberConsumer.current !== undefined) {
      Runtime.runSync(appRt)(
        pipe(
          fiberConsumer.current.fds.removeSubscription(fiberConsumer.current.id),
          Effect.flatMap((_) => Effect.yieldNow())
        )
      )
    }
    fiberConsumer.current = undefined
  }

  React.useEffect(() => {
    clearUpdater()
    fiberConsumer.current = FiberDataConsumer.createFiberUpdater(
      "FiberNavigator",
      appRt,
      (infos: FiberInfo.FiberInfo[]) => {
        const filtered = infos.filter((f) => FiberFilter.matchFiber(fiberFilter)(f))
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
          <FiberForceGraph
            filter={{
              ...fiberFilter,
              matchWords: false,
            }}
          />
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
          <Box
            sx={{
              padding: theme.pxPadding.medium,
            }}
          >
            <FiberFilter.FiberFilter
              filter={fiberFilter}
              onFilterChange={updateFiberFilter}
            ></FiberFilter.FiberFilter>
          </Box>
          <TableFiberInfo
            available={fibers}
            filter={fiberFilter}
            onRootSelect={onRootSelect}
            onTrace={onTrace}
            onPin={onPin}
          ></TableFiberInfo>
        </Box>
        <Box
          sx={{
            flexGrow: 1,
          }}
        >
          <StackTrace fibers={tracedFibers()} />
        </Box>
      </Box>
    </Box>
  )
}
