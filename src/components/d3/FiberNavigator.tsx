import { RuntimeContext } from "@components/app/App"
import { ContentBox } from "@components/contentbox/ContentBox"
import { StackTrace } from "@components/stacktrace/StackTrace"
import { TableFiberIds } from "@components/tablefiberid/TableFiberId"
import * as HashSet from "@effect/data/HashSet"
import * as Runtime from "@effect/io/Runtime"
import { Box } from "@mui/material"
import * as React from "react"

import type * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import { D3ForceGraph } from "./D3ForceGraph"
import * as FiberDataConsumer from "./FiberDataConsumer"

export const FiberNavigator: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)

  const [fibers, setFibers] = React.useState<FiberInfo.FiberInfo[]>([])
  const [selected, setSelected] = React.useState<HashSet.HashSet<FiberId.FiberId>>(
    HashSet.empty<FiberId.FiberId>()
  )

  React.useEffect(() => {
    const updater = FiberDataConsumer.createFiberUpdater(
      appRt,
      (infos: FiberInfo.FiberInfo[]) => {
        setFibers(infos)
      }
    )

    return () => {
      Runtime.runSync(appRt)(updater.fds.removeSubscription(updater.id))
    }
  }, [appRt])

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
          <D3ForceGraph />
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
            height: "50%",
          }}
        >
          <TableFiberIds
            available={HashSet.fromIterable(fibers.map((f) => f.id))}
            selection={selected}
            onSelect={(id) => setSelected(HashSet.make(id))}
          ></TableFiberIds>
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
