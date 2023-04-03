import * as d3 from "d3"
import * as React from "react"

import type * as FiberGraph from "./FiberGraph"

export interface CircleProps {
  node: FiberGraph.FiberNode
}

export function Circle(props: CircleProps) {
  const ref = React.useRef<SVGCircleElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      d3.select(ref.current).data([props.node])
    }
  }, [])

  return <circle id={`${props.node.fiber.id.id}`} ref={ref} />
}

export interface LineProps {
  link: FiberGraph.FiberLink
}

export function Line(props: LineProps) {
  const ref = React.useRef<SVGLineElement>(null)

  React.useEffect(() => {
    if (ref.current) {
      d3.select(ref.current).data([props.link])
    }
  }, [])

  return (
    <line
      ref={ref}
      id={`${props.link.source.fiber.id.id}-${props.link.target.fiber.id.id}`}
    />
  )
}
