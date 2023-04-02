import { RuntimeContext } from "@components/App"
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
          //.distance(30)
          .strength(0.6)
      )
      .force(
        "collide",
        d3
          .forceCollide()
          .strength(0.2)
          .radius(
            (f: d3.SimulationNodeDatum) => radiusAccessor(f as FiberGraph.FiberNode) * 3
          )
      )
      .force("charge", d3.forceManyBody().strength(-3).distanceMin(15))
      .force("center", d3.forceCenter(w / 2, h / 2).strength(0.3))
      .force("x", d3.forceX(w / 2).strength(0.003))
      .force("y", d3.forceY(h / 2).strength(0.003))
      .alphaTarget(0.002)
      .on("tick", ticked)
  }

  const group = () => {
    const sel = d3.select("#FiberGraph")
    return sel
  }

  const node = () => {
    const nodes = group().selectAll<SVGCircleElement, FiberGraph.FiberNode>("circle")

    return nodes
      .attr("r", (d) => {
        return radiusAccessor(d)
      })
      .attr("stroke", "cyan")
      .attr("stroke-width", 1)
      .attr("fill", (d) => colorScale(FiberGraph.stateAccessor(d)))
  }

  const link = () =>
    group()
      .selectAll<SVGLineElement, FiberGraph.FiberLink>("line")
      .attr("stroke", "white")
      .attr("stroke-width", 1)

  function ticked() {
    node()
      .attr("cx", (d) => xAccessor(d))
      .attr("cy", (d) => yAccessor(d))

    link()
      .attr("x1", (d) => xAccessor(d.source))
      .attr("y1", (d) => yAccessor(d.source))
      .attr("x2", (d) => xAccessor(d.target))
      .attr("y2", (d) => yAccessor(d.target))
  }

  React.useEffect(() => {
    FiberDataConsumer.createFiberUpdater(appRt, (infos: FiberInfo.FiberInfo[]) => {
      dataRef.current = FiberGraph.updateFiberNodes(dataRef.current, infos)
      const newGraph = FiberGraph.updateFiberGraph(graphData, dataRef.current)
      if (simRef.current) {
        simRef.current.nodes(newGraph.nodes)
        // @ts-ignore
        simRef.current.force("link").links(newGraph.links)
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
