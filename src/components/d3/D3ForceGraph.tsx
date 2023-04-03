import { RuntimeContext } from "@components/App"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import * as d3 from "d3"
import * as React from "react"

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import { Circle, Line } from "./Circle"
import * as FiberDataConsumer from "./FiberDataConsumer"
import * as FiberGraph from "./FiberGraph"
import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

export const D3ForceGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  // The state is the data backing the actual graph
  const [graphData, setGraphData] = React.useState<FiberGraph.FiberGraph>({
    nodes: [],
    links: [],
  })
  // We keep a shadow copy of the data in a ref, so we can use it to determine node updates and removals
  const dataRef = React.useRef<FiberGraph.FiberNode[]>([])

  const simRef =
    React.useRef<d3.Simulation<FiberGraph.FiberNode, FiberGraph.FiberLink>>()

  const dimensions = React.useRef<D3Utils.Dimensions>(D3Utils.emptyDimensions)
  const boundedWidth = () => D3Utils.boundedDimensions(dimensions.current)[0]
  const boundedHeight = () => D3Utils.boundedDimensions(dimensions.current)[1]

  const idAccessor = (f: FiberGraph.FiberNode) => f.fiber.id.id
  const radiusAccessor = (f: FiberGraph.FiberNode) => f.radius
  const xAccessor = (f: FiberGraph.FiberNode) =>
    f.x ? f.x : Math.floor(Math.random() * boundedWidth())
  const yAccessor = (f: FiberGraph.FiberNode) =>
    f.y ? f.y : Math.floor(Math.random() * boundedHeight())

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(["Succeeded", "Errored", "Running", "Suspended", "Root", "Unknown"])
    .range(["green", "red", "cornflowerblue", "gold", "gray", "gray"])

  const simulation = () => {
    const [w, h] = D3Utils.boundedDimensions(dimensions.current)

    return d3
      .forceSimulation<FiberGraph.FiberNode, FiberGraph.FiberLink>()
      .force(
        "link",
        d3
          .forceLink<FiberGraph.FiberNode, FiberGraph.FiberLink>()
          .id(idAccessor)
          .distance(30)
          .strength(0.6)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.3)
          .radius(
            (f: d3.SimulationNodeDatum) => radiusAccessor(f as FiberGraph.FiberNode) * 3
          )
      )
      .force("charge", d3.forceManyBody().strength(-20).distanceMin(30))
      .force("center", d3.forceCenter(w / 2, h / 2).strength(0.03))
      .force("x", d3.forceX(w / 2).strength(0.03))
      .force("y", d3.forceY(h / 2).strength(0.03))
      .alphaTarget(0.0015)
      .alphaDecay(0.005)
      .stop()
  }

  const group = Effect.try(() => {
    const sel = d3.select("#FiberGraph")
    return sel
  })

  const node = Effect.gen(function* ($) {
    const grp = yield* $(group)

    return grp
      .selectAll<SVGCircleElement, FiberGraph.FiberNode>("circle")
      .attr("r", (d) => {
        return radiusAccessor(d)
      })
      .attr("stroke", "cyan")
      .attr("stroke-width", 1)
      .attr("fill", (d) => colorScale(FiberGraph.stateAccessor(d)))
  })

  const link = Effect.gen(function* ($) {
    const grp = yield* $(group)

    return grp
      .selectAll<SVGLineElement, FiberGraph.FiberLink>("line")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  })

  const ticked = Effect.gen(function* ($) {
    const circles = yield* $(node)
    circles.attr("cx", (d) => xAccessor(d)).attr("cy", (d) => yAccessor(d))

    const lines = yield* $(link)
    lines
      .attr("x1", (d) => xAccessor(d.source))
      .attr("y1", (d) => yAccessor(d.source))
      .attr("x2", (d) => xAccessor(d.target))
      .attr("y2", (d) => yAccessor(d.target))
  })

  const singleTick = Effect.try(() => {
    if (simRef.current) {
      simRef.current.tick()
    }
  })

  React.useEffect(() => {
    FiberDataConsumer.createFiberUpdater(appRt, (infos: FiberInfo.FiberInfo[]) => {
      dataRef.current = FiberGraph.updateFiberNodes(dataRef.current, infos)
      const newGraph = FiberGraph.updateFiberGraph(graphData, dataRef.current)
      if (simRef.current) {
        simRef.current.nodes(newGraph.nodes).alphaTarget(1).restart()
        // @ts-ignore
        simRef.current.force("link").links(newGraph.links)
        Runtime.runFork(appRt)(Effect.zipRight(ticked, Effect.repeatN(200)(singleTick)))
      }
      setGraphData(newGraph)
    })
  }, [appRt])

  const circles = (w: number, h: number) => (
    <>
      {graphData.nodes.map((n) => {
        return <Circle key={idAccessor(n)} node={n} />
      })}
    </>
  )

  const lines = () => (
    <>
      {graphData.links.map((l) => {
        return <Line key={`${idAccessor(l.source)}-${idAccessor(l.target)}`} link={l} />
      })}
    </>
  )

  return (
    <SVGPanel.SVGPanel>
      <SVGPanel.SVGDimensions.Consumer>
        {(dms) => {
          const [w, h] = D3Utils.boundedDimensions(dms)
          dimensions.current = dms
          simRef.current = simulation()
          return (
            <g id="FiberGraph" transform="translate(10, 10)">
              {circles(w, h)}
              {lines()}
            </g>
          )
        }}
      </SVGPanel.SVGDimensions.Consumer>
    </SVGPanel.SVGPanel>
  )
}
