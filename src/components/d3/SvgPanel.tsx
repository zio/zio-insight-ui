import * as d3 from "d3"
import * as React from "react"

import * as Geometry from "./SvgGeometry"

export interface SVGPanelProps {
  scale: [number, number] | undefined
  content: (
    _: d3.Selection<SVGGElement, unknown, null, undefined>,
    geom: Geometry.SvgGeometry
  ) => any
}

export const SVGPanel: React.FC<SVGPanelProps> = (props) => {
  const ref = React.useRef<HTMLDivElement>(null)
  const padding = 20

  const createSvg = () => {
    if (ref.current) {
      const geom = new Geometry.SvgGeometry(ref.current, padding)

      const zoom = (minScale: number, maxScale: number) =>
        d3
          .zoom<SVGSVGElement, unknown>()
          .scaleExtent([minScale, maxScale])
          .extent([
            [0, 0],
            [geom.svgWidth, geom.svgHeight],
          ])
          .on("zoom", zoomed)

      const container = d3.select(ref.current)
      // Make sure the final document has only 1 svg element
      container.select("svg").remove()

      // Now we add the SVG container to the DOM
      const svg = container
        .append("svg")
        .attr("width", geom.svgWidth)
        .attr("height", geom.svgHeight)
        .attr("viewBox", [0, 0, geom.svgWidth, geom.svgHeight])

      if (props.scale) {
        const z = zoom(props.scale[0], props.scale[1])
        svg
          .call(z)
          .call(z.transform, d3.zoomIdentity.translate(padding, padding).scale(1))
      }

      // The canvas we want to draw on s
      const canvas = svg
        .append("g")
        .attr("transform", `translate(${padding}, ${padding})`)

      props.content(canvas, geom)

      // A callback for the zoom and pan
      function zoomed(e: d3.D3ZoomEvent<SVGSVGElement, unknown>) {
        try {
          canvas.attr("transform", e.transform as any)
        } catch {
          // ignore
        }
      }
    }
  }

  React.useEffect(() => {
    createSvg()
  }, [])

  return <div className="grow flex relative" ref={ref}></div>
}
