import * as React from "react"

import * as D3Utils from "./Utils"

export const SVGDimensions = React.createContext<D3Utils.Dimensions>(
  D3Utils.emptyDimensions
)

export const SVGPanel: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [ref, dimensions] = D3Utils.useDimensions<HTMLDivElement>()

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

  return (
    <div ref={ref} className="grow flex relative">
      {element}
    </div>
  )
}
