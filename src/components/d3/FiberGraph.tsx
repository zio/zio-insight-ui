import type * as d3 from "d3"
import * as React from "react"

import type { SvgGeometry } from "./SvgGeometry"
import { SVGPanel } from "./SvgPanel"

export const FiberGraph: React.FC<{}> = (props) => {
  const rect = (
    canvas: d3.Selection<SVGGElement, unknown, null, undefined>,
    geom: SvgGeometry
  ) =>
    canvas
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", geom.svgWidth / 2)
      .attr("height", geom.svgHeight / 2)
      .attr("fill", "white")

  return <SVGPanel scale={[0.5, 3]} content={rect} />
}
