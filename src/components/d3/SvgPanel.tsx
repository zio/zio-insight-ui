// Import React and D3Utils
import * as React from "react"

import * as D3Utils from "./Utils"

// Create SVGDimensions context to store the dimensions of the SVG element
export const SVGDimensions = React.createContext<D3Utils.Dimensions>(
  D3Utils.emptyDimensions
)

// SVGPanel component that renders a div with an SVG element inside
export const SVGPanel: React.FC<React.PropsWithChildren<{}>> = (props) => {
  // Use useDimensions hook to get the dimensions of the div element
  const [ref, dimensions] = D3Utils.useDimensions<HTMLDivElement>()

  // Create an SVG element using the dimensions
  const element = React.useMemo(() => {
    const svgContent = (
      <SVGDimensions.Provider value={dimensions}>
        <g
          transform={`translate(${dimensions.margins.left},${dimensions.margins.top} )`}
        >
          {props.children}
        </g>
      </SVGDimensions.Provider>
    )

    return React.createElement("svg", { width: "100%", height: "100%" }, svgContent)
  }, [dimensions])

  // Render the div with the SVG element
  return (
    <div ref={ref} className="grow flex relative">
      {element}
    </div>
  )
}
