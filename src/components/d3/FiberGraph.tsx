import * as App from "@components/App"
import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"
import * as d3 from "d3"
import * as React from "react"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

import * as SVGPanel from "./SvgPanel"
import { Dimensions } from "./Utils"

interface FiberNode extends d3.SimulationNodeDatum {
  data: {
    fiber: F.FiberInfo
    radius: number
  }
}

const idAccessor = (f: FiberNode) => f.data.fiber.id.id
const radiusAccessor = (f: FiberNode) => f.data.radius
const xAccessor = (f: FiberNode) => (dms: Dimensions) =>
  f.x || Math.random() * dms.width
const yAccessor = (f: FiberNode) => (dms: Dimensions) =>
  f.y || Math.random() * dms.height

export const FiberGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)

  const [fibers, setFibers] = React.useState<FiberNode[]>([])

  const sim = (dms: Dimensions, data: FiberNode[]) => {
    d3.select("#FiberGraph").selectAll("*").remove()

    const group = d3.select("#FiberGraph").append("g")

    const nodes = group
      .selectAll<SVGCircleElement, FiberNode>("circle")
      .data(data, (d) => idAccessor(d))

    const ticked = () => {
      group.selectAll("*").remove()

      nodes
        .enter()
        .append("circle")
        .attr("r", (d) => {
          return radiusAccessor(d)
        })
        .attr("cx", (d) => xAccessor(d)(dms))
        .attr("cy", (d) => yAccessor(d)(dms))
        .attr("stroke", "black")
        .attr("stroke-width", 2)
        .attr("fill", "red")

      nodes
        .merge(nodes)
        .attr("cx", (d) => xAccessor(d)(dms))
        .attr("cy", (d) => yAccessor(d)(dms))

      nodes.exit().remove()
    }

    d3.forceSimulation(data)
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((f: d3.SimulationNodeDatum) => radiusAccessor(f as FiberNode))
      )
      .force("charge", d3.forceManyBody().strength(-1))
      .force("center", d3.forceCenter(dms.width / 2, dms.height / 2))
      .on("tick", ticked)
  }

  const fetchFibers = () => {
    return T.gen(function* ($) {
      const fibers = yield* $(
        pipe(
          Insight.getFibers,
          T.catchAll((_) => T.succeed([] as F.FiberInfo[]))
        )
      )
      yield* $(T.logDebug(`Got ${fibers.length} fibers from application`))
      return fibers.map((f) => {
        return {
          data: {
            fiber: f,
            radius: Math.random() * 15 + 5,
          },
        }
      })
    })
  }

  React.useEffect(() => {
    RT.runPromise(appRt)(fetchFibers()).then((fibers) => {
      setFibers(fibers)
    })
  }, [])

  return (
    <SVGPanel.SVGPanel>
      <SVGPanel.SVGDimensions.Consumer>
        {(dms) => {
          sim(dms, fibers)
          return <></>
        }}
      </SVGPanel.SVGDimensions.Consumer>
    </SVGPanel.SVGPanel>
  )
}
