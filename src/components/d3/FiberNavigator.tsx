import { RuntimeContext } from "@components/App"
import { TableFiberIds } from "@components/TableFiberId"
import { Scrollable } from "@components/panel/Scrollable"
import * as HashSet from "@effect/data/HashSet"
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
    FiberDataConsumer.createFiberUpdater(appRt, (infos: FiberInfo.FiberInfo[]) => {
      setFibers(infos)
    })
  }, [appRt])

  return (
    <div className="flex h-full flex-row relative">
      <div className="grow relative h-full">
        <D3ForceGraph />
      </div>
      <div className="w-1/2 flex relative h-full">
        <Scrollable>
          <TableFiberIds
            available={HashSet.fromIterable(fibers.map((f) => f.id))}
            selection={selected}
            onSelect={(id) => setSelected(HashSet.make(id))}
          ></TableFiberIds>
        </Scrollable>
      </div>
    </div>
  )
}
