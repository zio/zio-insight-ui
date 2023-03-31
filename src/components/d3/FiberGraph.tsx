import { RuntimeContext } from "@components/App"
import * as Effect from "@effect/io/Effect"
import type * as Fiber from "@effect/io/Fiber"
import * as Runtime from "@effect/io/Runtime"
import * as Stream from "@effect/stream/Stream"
//import * as d3 from "d3"
import * as React from "react"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberDataService from "@core/metrics/services/FiberDataService"

import * as Circle from "./Circle"
import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

// interface FiberNode extends d3.SimulationNodeDatum {
//   id: number
//   data: {
//     fiber: FiberInfo.FiberInfo
//     radius: number
//   }
// }

// interface FiberLink extends d3.SimulationLinkDatum<{}> {}

// const idAccessor = (f: FiberNode) => f.id
// const radiusAccessor = (f: FiberNode) => f.data.radius
// const xAccessor = (f: FiberNode) => (dms: D3Utils.Dimensions) =>
//   f.x ? f.x : Math.random() * dms.width
// const yAccessor = (f: FiberNode) => (dms: D3Utils.Dimensions) =>
//   f.y ? f.y : Math.random() * dms.height
// const stateAccessor = (f: FiberNode) => {
//   const keys = Object.keys(f.data.fiber.status)
//   return keys.length > 0 ? keys[0] : "Unknown"
// }

interface FiberUpdater {
  fds: FiberDataService.FiberDataService
  id: string
  updater: Fiber.Fiber<unknown, void>
}

export const FiberGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const [fiberInfos, setFiberInfos] = React.useState<FiberInfo.FiberInfo[]>([])

  React.useEffect(() => {
    const createUpdater = Effect.gen(function* ($) {
      const fds = yield* $(FiberDataService.FiberDataService)
      const [id, updates] = yield* $(fds.createSubscription())

      const updater = yield* $(
        Effect.forkDaemon(
          Stream.runForEach(updates, (infos) => {
            return Effect.attempt(() => {
              console.log(`--- ${infos.length} Fibers received`)
              setFiberInfos(infos)
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

    const runner = Runtime.runSync(appRt)(createUpdater)

    return () => {
      Runtime.runPromise(appRt)(runner.fds.removeSubscription(runner.id)).then((_) => {
        // do nothing
      })
    }
  }, [appRt])

  const createCircles = (dms: D3Utils.Dimensions, fibers: FiberInfo.FiberInfo[]) => {
    const [w, h] = D3Utils.boundedDimensions(dms)

    return (
      <g transform="translate(10, 10)">
        {fibers.map((f) => (
          <Circle.Circle<FiberInfo.FiberInfo>
            key={f.id.id}
            data={f}
            cx={Math.random() * w - 20}
            cy={Math.random() * h - 20}
            r={10}
            fill="red"
          />
        ))}
      </g>
    )
  }

  return (
    <>
      <SVGPanel.SVGPanel>
        <SVGPanel.SVGDimensions.Consumer>
          {(dms) => createCircles(dms, fiberInfos)}
        </SVGPanel.SVGDimensions.Consumer>
      </SVGPanel.SVGPanel>
    </>
  )
}
