import { RuntimeContext } from "@components/app/App"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import * as d3 from "d3"
import * as React from "react"

import * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import { Circle, Line } from "./Circle"
import * as FiberDataConsumer from "./FiberDataConsumer"
import * as FiberGraph from "./FiberGraph"
import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"
import { useInsightTheme } from "@components/theme/InsightTheme"
import * as FiberFilter from "./FiberFilter"

export interface FiberForceGraphProps {
  filter: FiberFilter.FiberFilterParams
}

export const FiberForceGraph: React.FC<FiberForceGraphProps> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const theme = useInsightTheme()

  // The state is the data backing the actual graph
  const [graphData, setGraphData] = React.useState<FiberGraph.FiberGraph>(FiberGraph.emptyFiberGraph)

  // We keep a shadow copy of the data in a ref, so we can use it to determine node updates and removals
  const dataRef = React.useRef<FiberGraph.FiberNode[]>([])

  const simRef =
    React.useRef<d3.Simulation<FiberGraph.FiberNode, FiberGraph.FiberLink>>()

  const simulating = React.useRef<boolean>(false)

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
    .domain(FiberInfo.FiberStates)
    .range([
      theme.status.Root, 
      theme.status.Suspended,
      theme.status.Running,
      theme.status.Succeeded,
      theme.status.Errored
    ])

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
          .strength(0.8)
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
  })

  const link = Effect.gen(function* ($) {
    const grp = yield* $(group)

    return grp
      .selectAll<SVGLineElement, FiberGraph.FiberLink>("line")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  })

  const ticked = Effect.gen(function* ($) {
    const duration = 2500
    const circles = yield* $(node)
    circles
      .transition()
      .duration(duration)
      .attr("cx", (d) => xAccessor(d))
      .attr("cy", (d) => yAccessor(d))
      .attr("fill", (d) => colorScale(FiberInfo.stateAsString(d.fiber)))

    const lines = yield* $(link)
    lines
      .transition()
      .duration(duration)
      .attr("x1", (d) => xAccessor(d.source))
      .attr("y1", (d) => yAccessor(d.source))
      .attr("x2", (d) => xAccessor(d.target))
      .attr("y2", (d) => yAccessor(d.target))
  })

  const runTicks = (n: number) =>
    Effect.try(() => {
    if (simRef.current) {
      simRef.current.tick(n)
    }
    })

  const simulate = (newGraph: FiberGraph.FiberGraph) => Effect.gen(function* ($) {
    if (!simulating.current) {
      simulating.current = true
      if (simRef.current) { 
        simRef.current.nodes(newGraph.nodes).alphaTarget(0.0015).restart()
        // @ts-ignore
        simRef.current.force("link").links(newGraph.links)
        yield* $(runTicks(10))
        yield* $(ticked)
        setGraphData(newGraph)
      }
      simulating.current = false
    }
  })

  React.useEffect(() => {
    const updater = FiberDataConsumer.createFiberUpdater(
      appRt,
      (infos: FiberInfo.FiberInfo[]) => {
        dataRef.current = FiberGraph.updateFiberNodes(
          dataRef.current, 
          infos.filter(f => FiberFilter.matchFiber(props.filter)(f))
        )
        const newGraph = FiberGraph.updateFiberGraph(graphData, dataRef.current)
        Runtime.runPromise(appRt)(simulate(newGraph))
      }
    )

    return () => Runtime.runSync(appRt)(updater.fds.removeSubscription(updater.id))
  }, [appRt, props])

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
