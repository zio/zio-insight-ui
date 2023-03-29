import * as d3 from "d3"
import * as React from "react"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"

import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

interface FiberNode extends d3.SimulationNodeDatum {
  id: number
  data: {
    fiber: F.FiberInfo
    radius: number
  }
}

interface FiberLink extends d3.SimulationLinkDatum<{}> {}

const idAccessor = (f: FiberNode) => f.id
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
  return <h1>hi</h1>
}
