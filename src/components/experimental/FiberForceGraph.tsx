import { RuntimeContext } from "@components/app/App"
import { useInsightTheme } from "@components/theme/InsightTheme"
import * as HashSet from "@effect/data/HashSet"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import * as d3 from "d3"
import type { D3DragEvent } from "d3"
import * as React from "react"

import * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"

import { Circle, Line } from "./Circle"
import * as FiberDataConsumer from "./FiberDataConsumer"
import * as FiberFilter from "./FiberFilter"
import * as FiberGraph from "./FiberGraph"
import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

export interface FiberForceGraphProps {
  filter: FiberFilter.FiberFilterParams
  onFilterChange: (f: FiberFilter.FiberFilterParams) => void
}

export const FiberForceGraph: React.FC<FiberForceGraphProps> = (props) => {
  const appRt = React.useContext(RuntimeContext)
  const theme = useInsightTheme()
  const filterRef = React.useRef<FiberFilter.FiberFilterParams>(props.filter)

  const setFilter = (f: FiberFilter.FiberFilterParams) => {
    filterRef.current = f
    props.onFilterChange(f)
  }

  const dragSubject = React.useRef<SVGCircleElement>()

  // The state is the data backing the actual graph
  const [graphData, setGraphData] = React.useState<FiberGraph.FiberGraph>(
    FiberGraph.emptyFiberGraph
  )

  // We keep a shadow copy of the data in a ref, so we can use it to determine node updates and removals
  const dataRef = React.useRef<FiberGraph.FiberNode[]>([])

  const simRef =
    React.useRef<d3.Simulation<FiberGraph.FiberNode, FiberGraph.FiberLink>>()

  const zoomRef = React.useRef<d3.ZoomBehavior<SVGSVGElement, unknown>>()

  const simulating = React.useRef<boolean>(false)

  const dimensions = React.useRef<D3Utils.Dimensions>(D3Utils.emptyDimensions)
  const left = () => dimensions.current.margins.left || 0
  const top = () => dimensions.current.margins.top || 0

  const boundedWidth = () => D3Utils.boundedDimensions(dimensions.current)[0]
  const boundedHeight = () => D3Utils.boundedDimensions(dimensions.current)[1]

  const idAccessor = (f: FiberGraph.FiberNode) => f.fiber.id.id
  const radiusAccessor = (f: FiberGraph.FiberNode) => f.radius
  const xAccessor = (f: FiberGraph.FiberNode) =>
    f.fx ? f.fx : f.x ? f.x : Math.floor(Math.random() * boundedWidth())
  const yAccessor = (f: FiberGraph.FiberNode) =>
    f.fy ? f.fy : f.y ? f.y : Math.floor(Math.random() * boundedHeight())

  const colorScale = d3
    .scaleOrdinal<string>()
    .domain(FiberInfo.FiberStates)
    .range([
      theme.theme.status.Root,
      theme.theme.status.Suspended,
      theme.theme.status.Running,
      theme.theme.status.Succeeded,
      theme.theme.status.Errored,
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

  const group = () => {
    const sel = d3.select("#FiberGraph")
    return sel
  }

  const zoom = () => {
    if (dimensions.current === undefined) {
      return undefined
    }

    const svg = d3.select<SVGSVGElement, unknown>("#D3Graph")
    const grp = d3.select<SVGGElement, unknown>("#FiberGraph")

    const res = d3
      .zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 10])
      .on("zoom", (evt: d3.D3ZoomEvent<SVGSVGElement, unknown>) => {
        // @ts-ignore
        grp.attr("transform", evt.transform)
      })

    // Add the zoom behavior to the SVG element
    svg
      .attr("viewBox", [0, 0, dimensions.current.width, dimensions.current.height])
      .call(res)
      .call(res.transform, d3.zoomIdentity.translate(left(), top()).scale(1))

    return res
  }

  const dragNode = d3
    .drag<SVGCircleElement, FiberGraph.FiberNode>()
    .on("start", (evt: any, node: FiberGraph.FiberNode) => {
      dragstarted(evt, node)
    })
    .on("drag", (evt: any, node: FiberGraph.FiberNode) => {
      dragged(evt, node)
    })
    .on("end", (evt: any, node: FiberGraph.FiberNode) => {
      dragended(evt, node)
    })

  const node = () => {
    return group()
      .selectAll<SVGCircleElement, FiberGraph.FiberNode>("circle")
      .attr("r", (d) => {
        return radiusAccessor(d)
      })
      .attr("fill", (d) => colorScale(FiberInfo.stateAsString(d.fiber)))
      .attr("stroke", "cyan")
      .attr("stroke-width", 1)
      .call(dragNode)
  }

  const link = () => {
    return group()
      .selectAll<SVGLineElement, FiberGraph.FiberLink>("line")
      .attr("stroke", "white")
      .attr("stroke-width", 1)
  }

  const ticked = Effect.try(() => {
    const duration = 2500
    node()
      .transition()
      .duration(duration)
      .attr("cx", (d) => xAccessor(d))
      .attr("cy", (d) => yAccessor(d))
      .attr("fill", (d) => colorScale(FiberInfo.stateAsString(d.fiber)))

    link()
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

  const simulate = (newGraph: FiberGraph.FiberGraph) =>
    Effect.gen(function* ($) {
      if (simRef.current) {
        simRef.current.nodes(newGraph.nodes) // .alphaTarget(0.0015).restart()
        // @ts-ignore
        simRef.current.force("link").links(newGraph.links)
        yield* $(runTicks(10))
        yield* $(ticked)
        setGraphData(newGraph)
      }
      simulating.current = false
    })

  React.useEffect(() => {
    const updater = FiberDataConsumer.createFiberUpdater(
      "FiberGraph",
      appRt,
      (infos: FiberInfo.FiberInfo[]) => {
        if (!simulating.current && dragSubject.current === undefined) {
          if (zoomRef.current == undefined) {
            zoomRef.current = zoom()
          }
          simulating.current = true
          console.log(
            `${new Date()} -- In graph update, ${JSON.stringify(props.filter)}`
          )
          dataRef.current = FiberGraph.updateFiberNodes(
            dataRef.current,
            infos.filter((f) => FiberFilter.matchFiber(props.filter)(f)),
            props.filter.pinned
          )
          const newGraph = FiberGraph.updateFiberGraph(graphData, dataRef.current)
          Runtime.runPromise(appRt)(simulate(newGraph))
        }
      }
    )

    return () => Runtime.runSync(appRt)(updater.fds.removeSubscription(updater.id))
  }, [props.filter])

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

  const dragstarted = (
    evt: D3DragEvent<SVGCircleElement, FiberGraph.FiberNode, FiberGraph.FiberNode>,
    node: FiberGraph.FiberNode
  ) => {
    if (!evt.active) {
      const circle = evt.sourceEvent.target as SVGCircleElement
      dragSubject.current = circle
      evt.sourceEvent.stopPropagation()

      d3.select(circle).attr("r", 10)

      setFilter({
        ...props.filter,
        pinned: HashSet.add(filterRef.current.pinned, node.fiber.id.id),
      })

      node.x = evt.x
      node.y = evt.y
      node.fx = evt.x
      node.fy = evt.y
    }
  }

  const dragged = (
    evt: D3DragEvent<SVGCircleElement, FiberGraph.FiberNode, FiberGraph.FiberNode>,
    node: FiberGraph.FiberNode
  ) => {
    if (dragSubject.current !== undefined) {
      evt.sourceEvent.stopPropagation()

      d3.select(dragSubject.current).attr("cx", evt.x).attr("cy", evt.y)

      link()
        .attr("x1", (d) => xAccessor(d.source))
        .attr("y1", (d) => yAccessor(d.source))
        .attr("x2", (d) => xAccessor(d.target))
        .attr("y2", (d) => yAccessor(d.target))

      node.x = evt.x
      node.y = evt.y
      node.fx = evt.x
      node.fy = evt.y
    }
  }

  const dragended = (
    evt: D3DragEvent<SVGCircleElement, FiberGraph.FiberNode, FiberGraph.FiberNode>,
    node: FiberGraph.FiberNode
  ) => {
    if (!evt.active) {
      dragSubject.current = undefined
    }
  }

  return (
    <SVGPanel.SVGPanel
      id="D3Graph"
      margins={{
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      }}
    >
      <SVGPanel.SVGDimensions.Consumer>
        {(dms) => {
          const [w, h] = D3Utils.boundedDimensions(dms)
          dimensions.current = dms
          simRef.current = simulation()
          return (
            <g id="FiberGraph">
              {lines()}
              {circles(w, h)}
            </g>
          )
        }}
      </SVGPanel.SVGDimensions.Consumer>
    </SVGPanel.SVGPanel>
  )
}
