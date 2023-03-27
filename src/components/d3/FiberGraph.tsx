import * as App from "@components/App"
import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"
import * as d3 from "d3"
import * as React from "react"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

import type { SvgGeometry } from "./SvgGeometry"
import { SVGPanel } from "./SvgPanel"

interface FiberNode extends d3.SimulationNodeDatum {
  data: {
    radius: number
    name: string
    id: number
  }
}

export const FiberGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)

  const [fibers, setFibers] = React.useState<FiberNode[]>([])

  // const fetchFibers = () => {
  //   return T.gen(function* ($) {
  //     const fibers = yield* $(
  //       pipe(
  //         Insight.getFibers,
  //         T.catchAll((_) => T.succeed([] as F.FiberInfo[]))
  //       )
  //     )
  //     yield* $(T.logDebug(`Got ${fibers.length} fibers from application`))
  //     return fibers.map((f) => ({ data: f } as FiberNode))
  //   })
  // }

  // React.useEffect(() => {
  //   RT.runPromise(appRt)(fetchFibers()).then((fibers) => {
  //     setFibers(fibers)
  //     update(fibers)
  //   })
  // }, [])

  const content = (
    canvas: d3.Selection<SVGGElement, unknown, null, undefined>,
    geom: SvgGeometry
  ) => {
    const data = [
      "Andreas",
      "Karin",
      "Tatjana",
      "Sabrina",
      "Pepino",
      "Vishnu",
      "Pequeno",
      "Pequena",
    ].map(
      (name, id) =>
        ({
          data: { name: name, id: id, radius: Math.floor(Math.random() * 20 + 5) },
        } as FiberNode)
    )

    const sim = d3
      .forceSimulation()
      .force(
        "link",
        d3.forceLink().id((f: d3.SimulationNodeDatum) => (f as FiberNode).data.id)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .radius((f: d3.SimulationNodeDatum) => (f as FiberNode).data.radius)
      )
      .force(
        "charge",
        d3.forceManyBody().strength((d) => (d as FiberNode).data.radius * 3)
      )
      .force("center", d3.forceCenter(geom.svgWidth / 2, geom.svgHeight / 2))

    const node = canvas
      .append("g")
      .attr("class", "node")
      .selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("r", (d) => d.data.radius)
      .attr("fill", "lightblue")
      .attr("stroke", "cyan")

    function ticked() {
      console.log("tick")
      node
        .enter()
        .append("circle")
        .attr("r", (d) => d.data.radius)
        .attr("fill", "red")
        .merge(node)
        .attr("cx", (d) => (d.x ? d.x : 0))
        .attr("cy", (d) => (d.y ? d.y : 0))

      node.exit().remove()
    }

    sim.nodes(data).on("tick", ticked)
  }

  return <SVGPanel scale={[0.5, 3]} content={content} />
}
