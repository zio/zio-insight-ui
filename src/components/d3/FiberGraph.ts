import type * as FiberId from "@core/metrics/model/insight/fibers/FiberId"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

export interface FiberNode {
  id: number
  fiber: FiberInfo.FiberInfo
}

export interface FiberLink {
  source: number
  target: number
}

export interface FiberGraph {
  nodes: FiberNode[]
  links: FiberLink[]
}

const rootId = {
  id: -1,
  startTimeMillis: 0,
  location: ["", "", 0],
} as FiberId.FiberId

// an artificial root node that will be used as a "parent" for all nodes that do not have a parent
// that can be calculated from the data
// This is used only because the result force graphs look nicer
export const root = {
  id: rootId,
  status: {
    Root: {},
  },
} as FiberInfo.FiberInfo

export function updateFiberNodes(
  oldNodes: FiberNode[],
  infos: FiberInfo.FiberInfo[]
): FiberNode[] {
  // determine which nodes are added to the graph
  const newNodes = infos
    .slice()
    .filter((info) => oldNodes.find((i) => i.id == info.id.id) === undefined)

  // Now we need to update nodes that previously existed with the new data
  const updated = oldNodes.reduce((acc, old) => {
    const updated = infos.find((i) => i.id.id == old.id)
    if (updated) {
      old.fiber = updated
      return [...acc, old]
    } else {
      return acc
    }
  }, [] as FiberNode[])

  updated.push(
    ...newNodes.slice().map(
      (info) =>
        ({
          id: info.id.id,
          fiber: info,
        } as FiberNode)
    )
  )

  return updated
}

export const updateFiberGraph = (
  old: FiberGraph,
  newNodes: FiberNode[]
): FiberGraph => {
  const nodes = newNodes.slice()

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

  return {
    nodes,
    links,
  }
}
