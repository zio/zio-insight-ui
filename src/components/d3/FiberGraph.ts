import type * as d3 from "d3"

import type * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

export interface FiberNode extends d3.SimulationNodeDatum {
  radius: number
  fiber: FiberInfo.FiberInfo
}

export interface FiberLink extends d3.SimulationLinkDatum<FiberNode> {
  source: FiberNode
  target: FiberNode
}

export interface FiberGraph {
  nodes: FiberNode[]
  links: FiberLink[]
}

export const emptyFiberGraph = {
  nodes: [],
  links: []
} as FiberGraph

const createNode = (info: FiberInfo.FiberInfo) => {
  return {
    id: info.id.id,
    radius: 5,
    fiber: info,
  } as FiberNode
}

export const idAccessor = (f: FiberNode) => f.fiber.id.id

const rootId = {
  id: -1,
  startTimeMillis: 0,
  location: ["", "", 0],
} as FiberId.FiberId

// an artificial root node that will be used as a "parent" for all nodes that do not have a parent
// that can be calculated from the data
// This is used only because the result force graphs look nicer
export const root = createNode({
  id: rootId,
  status: {
    Root: {},
  },
  trace: [],
})

export function updateFiberNodes(
  oldNodes: FiberNode[],
  infos: FiberInfo.FiberInfo[]
): FiberNode[] {
  // determine which nodes are added to the graph
  const newNodes = infos
    .slice()
    .filter((info) => oldNodes.find((i) => idAccessor(i) == info.id.id) === undefined)

  // Now we need to update nodes that previously existed with the new data
  const updated = oldNodes.reduce((acc, old) => {
    const updated = infos.find((i) => i.id.id == idAccessor(old))
    if (updated) {
      old.fiber = updated
      return [...acc, old]
    } else {
      return acc
    }
  }, [] as FiberNode[])

  updated.push(...newNodes.slice().map((info) => createNode(info)))

  return updated
}

export const updateFiberGraph = (
  old: FiberGraph,
  newNodes: FiberNode[]
): FiberGraph => {
  const nodes = newNodes.slice()

  nodes.push(root)

  const links = nodes.reduce((acc, info) => {
    const p = info.fiber.parent
    const source = (() => {
      if (p) {
        const mbNode = nodes.find((i) => idAccessor(i) == p.id)
        return mbNode ? mbNode : root
      } else {
        return root
      }
    })()
    acc.push({
      source,
      target: info,
    } as FiberLink)
    return acc
  }, [] as FiberLink[])

  return {
    nodes,
    links,
  }
}
