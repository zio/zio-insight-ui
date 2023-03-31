import * as React from "react"

import * as SVGPanel from "./SvgPanel"
import * as D3Utils from "./Utils"

// interface FiberNode extends d3.SimulationNodeDatum {
//   id: number
//   data: {
//     fiber: F.FiberInfo
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

const createGraph = (dms: D3Utils.Dimensions) => {
  const [w, h] = D3Utils.boundedDimensions(dms)

  return (
    <g>
      <rect width={w} height={h} fill="white" />
      <line x1={0} y1={0} x2={w} y2={h} stroke="black" />
      <line x1={0} y1={h} x2={w} y2={0} stroke="black" />

      <circle cx={w / 2} cy={h / 2} r={50} fill="red" />
    </g>
  )
}

export const FiberGraph: React.FC<{}> = (props) => {
  return (
    <SVGPanel.SVGPanel>
      <SVGPanel.SVGDimensions.Consumer>
        {(dms) => createGraph(dms)}
      </SVGPanel.SVGDimensions.Consumer>
    </SVGPanel.SVGPanel>
  )
}
