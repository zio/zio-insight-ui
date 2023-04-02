import { RuntimeContext } from "@components/App"
import * as React from "react"
import * as ForceGraph from "react-force-graph"

import type * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

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

const rootId = {
  id: -1,
  startTimeMillis: 0,
  location: ["", "", 0],
} as FiberId.FiberId

const root = {
  id: rootId,
  status: {
    Root: {},
  },
} as FiberInfo.FiberInfo

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
    const nodes = dataRef.current.slice()
    nodes.push({
      id: rootId.id,
      fiber: root,
    } as FiberNode)

    const links = nodes.reduce((acc, info) => {
      const p = info.fiber.parent
      const source = (() => {
        if (p) {
          if (nodes.find((i) => i.id == p.id) !== undefined) {
            return p.id
          } else {
            return rootId.id
          }
        } else {
          return rootId.id
        }
      })()
      acc.push({
        source,
        target: info.id,
      } as FiberLink)
      return acc
    }, [] as FiberLink[])

    setGraphData({
      nodes,
      links,
    })
  }

  const updateReference = (infos: FiberInfo.FiberInfo[]) => {
    const newNodes = infos
      .slice()
      .filter((info) => dataRef.current.find((i) => i.id == info.id.id) === undefined)

    const oldNodes = dataRef.current.reduce((acc, old) => {
      const updated = infos.find((i) => i.id.id == old.id)
      if (updated) {
        old.fiber = updated
        return [...acc, old]
      } else {
        return acc
      }
    }, [] as FiberNode[])

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
      nodeLabel={(node) => {
        const f = (node as FiberNode).fiber
        const lbl = `${f.id.id} - ${f.id.location[0]}(${f.id.location[1]}:${f.id.location[2]})`
        return lbl
      }}
      linkDirectionalArrowLength={3}
      onNodeDragEnd={(node) => {
        node.fx = node.x
        node.fy = node.y
        node.fz = node.z
      }}
      onNodeClick={(node) => {
        console.log(`Clicked on node ${node.id}`)
      }}
      nodeAutoColorBy={(node) => {
        const f = (node as FiberNode).fiber
        return Object.keys(f.status).length > 0 ? Object.keys(f.status)[0] : ""
      }}
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
