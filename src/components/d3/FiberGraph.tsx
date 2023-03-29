import * as App from "@components/App"
import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"
import * as d3 from "d3"
import * as React from "react"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

interface FiberNode extends d3.SimulationNodeDatum {
  data: {
    fiber: F.FiberInfo
    radius: number
  }
}

const idAccessor = (f: FiberNode) => f.data.fiber.id.id
const radiusAccessor = (f: FiberNode) => f.data.radius
const xAccessor = (f: FiberNode) => (dms: D3Utils.Dimensions) =>
  f.x ? f.x : Math.random() * dms.width
const yAccessor = (f: FiberNode) => (dms: D3Utils.Dimensions) =>
  f.y ? f.y : Math.random() * dms.height
const stateAccessor = (f: FiberNode) => {
  const keys = Object.keys(f.data.fiber.status)
  return keys.length > 0 ? keys[0] : "Unknown"
}

export const FiberGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)
  const [dimensions, setDimensions] = React.useState<D3Utils.Dimensions>({
    width: 2000,
    height: 1200,
    margins: {},
  })

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(["Succeeded", "Errored", "Running", "Suspended", "Unknown"])
    .range(["green", "red", "cornflowerblue", "gold", "gray"])

  const simulation = d3
    .forceSimulation<FiberNode>()
    .force(
      "collide",
      d3
        .forceCollide()
        .radius((f: d3.SimulationNodeDatum) => radiusAccessor(f as FiberNode) * 2)
    )
    .force("charge", d3.forceManyBody().strength(-2))
    .force("center", d3.forceCenter(dimensions.width / 2, dimensions.height / 2))
    .alphaTarget(0.2)
    //.force("x", d3.forceX())
    //.force("y", d3.forceY())
    .on("tick", ticked)

  const group = () => d3.select("#FiberGraph").select("g")
  const node = () =>
    group()
      .selectAll<SVGCircleElement, FiberNode>("circle")
      .attr("r", (d) => {
        return radiusAccessor(d)
      })
      .attr("stroke", "cyan")
      .attr("stroke-width", 2)
      .attr("fill", (d) => colorScale(stateAccessor(d)))

  function ticked() {
    node()
      .attr("cx", (d) => xAccessor(d)(dimensions))
      .attr("cy", (d) => yAccessor(d)(dimensions))
  }

  const fetchFibers = () => {
    return T.gen(function* ($) {
      const newStates = yield* $(
        pipe(
          Insight.getFibers,
          T.catchAll((_) => T.succeed([] as F.FiberInfo[]))
        )
      )

      const curNodes = HMap.fromIterable(
        node()
          .data()
          .map((n) => [idAccessor(n), n])
      )

      return newStates.map((f) => {
        const getPos = () => {
          const cur = HMap.get(curNodes, f.id.id)
          console.log(cur)
          const res: [number, number, number | undefined, number | undefined] =
            Opt.isNone(cur)
              ? [0, 0, undefined, undefined]
              : [
                  xAccessor(cur.value)(dimensions),
                  yAccessor(cur.value)(dimensions),
                  cur.value.vx,
                  cur.value.vy,
                ]

          return res
        }

        const [newX, newY, vx, vy] = getPos()

        return {
          data: {
            fiber: f,
            radius: Math.random() * 10 + 8,
            x: newX,
            y: newY,
            vx: vx,
            vy: vy,
          },
        } as FiberNode
      })
    })
  }

  React.useEffect(() => {
    const s = setInterval(() => {
      RT.runPromise(appRt)(fetchFibers()).then((newFibers) => {
        const change = node().data(newFibers, idAccessor)
        console.log(change)

        simulation.nodes(newFibers)
        simulation.alphaTarget(0.3)

        change.enter().append("circle")
        change.exit().remove()
      })
    }, 5000)

    return () => clearInterval(s)
  }, [dimensions])

  return (
    <SVGPanel.SVGPanel>
      <g>
        {/* <SVGPanel.SVGDimensions.Consumer>
          {(value) => {
            setDimensions(value)
            return <></>
          }}
        </SVGPanel.SVGDimensions.Consumer> */}
      </g>
    </SVGPanel.SVGPanel>
  )
}
