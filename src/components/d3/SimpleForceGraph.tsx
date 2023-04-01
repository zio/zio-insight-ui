import { RuntimeContext } from "@components/App"
import * as React from "react"
import * as ForceGraph from "react-force-graph"

import * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import * as FiberDataConsumer from "./FiberDataConsumer"

interface FiberNode {
  id: number
  fiber: FiberInfo.FiberInfo
}

interface FiberLink {
  source: number
  target: number
}

interface FiberGraph {
  nodes: FiberNode[]
  links: FiberLink[]
}

export const SimpleForceGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  // The state is the data backing the actual graph
  const [graphData, setGraphData] = React.useState<FiberGraph>({
    nodes: [],
    links: [],
  })
  // We keep a shadow copy of the data in a ref, so we can use it to determine node updates and removals
  const dataRef = React.useRef<FiberNode[]>([])

  const updateGraph = () => {
    console.log(`New data has ${dataRef.current.length} nodes`)

    const links = dataRef.current.reduce((acc, info) => {
      if (
        info.fiber.parent &&
        dataRef.current.find((i) => i.id == info.fiber.parent!.id) !== undefined
      ) {
        acc.push({
          source: info.fiber.parent.id,
          target: info.fiber.id.id,
        } as FiberLink)
        return acc
      } else {
        return acc
      }
    }, [] as FiberLink[])

    setGraphData({
      nodes: dataRef.current,
      links,
    })
  }

  const updateReference = (infos: FiberInfo.FiberInfo[]) => {
    console.log(`1- Received update with ${infos.length} fibers`)

    const newNodes = infos
      .slice()
      .filter((info) => dataRef.current.find((i) => i.id == info.id.id) === undefined)
    console.log(`2 - New nodes has ${newNodes.length} nodes`)

    const oldNodes = dataRef.current.filter(
      (info) => infos.find((i) => i.id.id == info.id) !== undefined
    )

    console.log(`3 - Old nodes has ${oldNodes.length} nodes`)

    oldNodes.push(
      ...newNodes.slice().map(
        (info) =>
          ({
            id: info.id.id,
            fiber: info,
          } as FiberNode)
      )
    )

    dataRef.current = oldNodes
    console.log(`New shadow data has ${dataRef.current.length} nodes`)
  }

  React.useEffect(() => {
    FiberDataConsumer.createFiberUpdater(appRt, (infos: FiberInfo.FiberInfo[]) => {
      updateReference(infos)
      updateGraph()
    })
  }, [appRt])

  return (
    <ForceGraph.ForceGraph3D
      graphData={graphData}
      nodeColor={(node) => {
        const f = (node as FiberNode).fiber
        const status = Object.keys(f.status).length > 0 ? Object.keys(f.status)[0] : ""
        switch (status) {
          case "Running":
            return "cornflowerblue"
          case "Suspended":
            return "yellow"
          case "Succeeded":
            return "green"
          case "Errored":
            return "red"
        }
        return "grey"
      }}
    />
  )
}
