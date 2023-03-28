import * as React from "react"

import * as D3Utils from "./Utils"

export const SVGDimensions = React.createContext<D3Utils.Dimensions>(
  D3Utils.emptyDimensions
)

export const SVGPanel: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [ref, dimensions] = D3Utils.useDimensions<HTMLDivElement>()

  const createSvg = () => {
    return (
      <svg id="FiberGraph" width={dimensions.width} height={dimensions.height}>
        {props.children}
      </svg>
    )
  }

  React.useEffect(() => {
    createSvg()
  }, [dimensions])

  return (
    <div ref={ref} className="grow flex relative">
      <SVGDimensions.Provider value={dimensions}>{createSvg()}</SVGDimensions.Provider>
    </div>
  )
}
