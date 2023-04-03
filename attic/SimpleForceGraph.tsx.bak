import { RuntimeContext } from "@components/App"
import * as React from "react"
import * as ForceGraph from "react-force-graph"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import * as FiberDataConsumer from "./FiberDataConsumer"
import * as FiberGraph from "./FiberGraph"

export const SimpleForceGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  // The state is the data backing the actual graph
  const [graphData, setGraphData] = React.useState<FiberGraph.FiberGraph>({
    nodes: [],
    links: [],
  })
  // We keep a shadow copy of the data in a ref, so we can use it to determine node updates and removals
  const dataRef = React.useRef<FiberGraph.FiberNode[]>([])

  React.useEffect(() => {
    FiberDataConsumer.createFiberUpdater(appRt, (infos: FiberInfo.FiberInfo[]) => {
      dataRef.current = FiberGraph.updateFiberNodes(dataRef.current, infos)
      setGraphData(FiberGraph.updateFiberGraph(graphData, dataRef.current))
    })
  }, [appRt])

  return (
    <ForceGraph.ForceGraph3D
      graphData={graphData}
      nodeLabel={(node) => {
        const f = (node as FiberGraph.FiberNode).fiber
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
        const f = (node as FiberGraph.FiberNode).fiber
        return Object.keys(f.status).length > 0 ? Object.keys(f.status)[0] : ""
      }}
      nodeColor={(node) => {
        const f = (node as FiberGraph.FiberNode).fiber
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
