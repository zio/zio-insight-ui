import * as React from "react"

import * as D3Utils from "./Utils"

export const SVGPanel: React.FC<React.PropsWithChildren<{}>> = (props) => {
  const [ref, dimensions] = D3Utils.useDimensions<HTMLDivElement>()

  const createSvg = () => {
    return (
      <svg width={dimensions.width} height={dimensions.height}>
        <rect
          width={dimensions.width}
          height={dimensions.height}
          fill="cornflowerblue"
        />

        {(([w, h]: [number, number]) => {
          return (
            <rect
              width={w}
              height={h}
              x={dimensions.margins.left || 0}
              y={dimensions.margins.top || 0}
              fill="orange"
            />
          )
        })(D3Utils.boundedDimensions(dimensions))}
      </svg>
    )
  }

  React.useEffect(() => {
    createSvg()
  }, [dimensions])

  return (
    <div ref={ref} className="grow flex relative">
      {createSvg()}
    </div>
  )
}
