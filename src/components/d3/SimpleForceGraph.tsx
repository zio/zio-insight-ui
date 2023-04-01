import { RuntimeContext } from "@components/App"
import * as HashMap from "@effect/data/HashMap"
import * as Effect from "@effect/io/Effect"
import type * as Fiber from "@effect/io/Fiber"
import * as Runtime from "@effect/io/Runtime"
import * as Stream from "@effect/stream/Stream"
import * as React from "react"
import * as ForceGraph from "react-force-graph"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberDataService from "@core/metrics/services/FiberDataService"

interface FiberNode {
  id: number
  fiber: FiberInfo.FiberInfo
}

interface FiberLink {
  source: number
  target: number
}

interface FiberUpdater {
  fds: FiberDataService.FiberDataService
  id: string
  updater: Fiber.Fiber<unknown, void>
}

interface FiberGraph {
  nodes: FiberNode[]
  links: FiberLink[]
}

export const SimpleForceGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const [graphData, setGraphData] = React.useState<FiberGraph>({
    nodes: [],
    links: [],
  })
  const dataRef = React.useRef<FiberGraph>(graphData)

  const createGraph = (infos: FiberInfo.FiberInfo[]) => {
    const nodeMap = HashMap.fromIterable<number, FiberNode>(
      infos.map((info) => {
        return [info.id.id, { id: info.id.id, fiber: info }] as [number, FiberNode]
      })
    )

    const nodes = infos.map((info) => {
      return {
        id: info.id.id,
        fiber: info,
      } as FiberNode
    })

    const links = infos.reduce((acc, info) => {
      if (info.parent && HashMap.has(nodeMap, info.parent.id)) {
        acc.push({ source: info.parent.id, target: info.id.id } as FiberLink)
        return acc
      } else {
        return acc
      }
    }, [] as FiberLink[])

    return {
      nodes,
      links,
    }
  }

  const updateData = (gd: FiberGraph) => {
    setGraphData(gd)
    dataRef.current = gd
  }

  const createUpdater = () => {
    const updater = Effect.gen(function* ($) {
      const fds = yield* $(FiberDataService.FiberDataService)
      const [id, updates] = yield* $(fds.createSubscription())

      const updater = yield* $(
        Effect.forkDaemon(
          Stream.runForEach(updates, (infos) => {
            return Effect.attempt(() => {
              if (infos.length > 0) {
                const newData = createGraph(infos)
                updateData(newData)
              }
            })
          })
        )
      )

      return {
        fds,
        id,
        updater,
      } as FiberUpdater
    })

    const runner = Runtime.runSync(appRt)(updater)

    Runtime.runPromise(appRt)(runner.fds.removeSubscription(runner.id)).then((_) => {
      // do nothing
    })
  }

  React.useEffect(() => {
    createUpdater()
  }, [appRt])

  return (
    <ForceGraph.ForceGraph3D
      graphData={graphData}
      nodeColor={(node) => {
        const f = (node as FiberNode).fiber
        const status = Object.keys(f.status).length > 0 ? Object.keys(f.status)[0] : ""
        console.log(status)
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
