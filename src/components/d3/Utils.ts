import * as React from "react"

const topDefault = 40
const rightDefault = 30
const bottomDefault = 40
const leftDefault = 75

export interface Margins {
  top?: number
  right?: number
  bottom?: number
  left?: number
}

export interface Dimensions {
  height: number
  width: number
  margins: Margins
}

export function boundedDimensions(d: Dimensions): [number, number] {
  return [
    Math.max(d.width - (d.margins.left || 0) - (d.margins.right || 0), 0),
    Math.max(d.height - (d.margins.top || 0) - (d.margins.bottom || 0), 0),
  ]
}

const combineChartDimensions = (d: Dimensions) => {
  return {
    width: d.width,
    height: d.height,
    margins: {
      top: d.margins.top || topDefault,
      right: d.margins.right || rightDefault,
      bottom: d.margins.bottom || bottomDefault,
      left: d.margins.left || leftDefault,
    },
  } as Dimensions
}

export const emptyDimensions = combineChartDimensions({
  width: 0,
  height: 0,
  margins: {},
})

export function useDimensions<T extends Element>(
  w?: number,
  h?: number,
  margins: Margins = {}
): [React.MutableRefObject<T | null>, Dimensions] {
  const ref = React.useRef<T>(null)
  const element = ref.current

  const [observedWidth, changeWidth] = React.useState(0)
  const [observedHeight, changeHeight] = React.useState(0)

  React.useEffect(() => {
    const resizeObserver = new ResizeObserver((entries: Array<ResizeObserverEntry>) => {
      if (entries.length == 0) return
      const entry = entries[0]

      if (observedWidth !== entry.contentRect.width)
        changeWidth(entry.contentRect.width)
      if (observedHeight !== entry.contentRect.height)
        changeHeight(entry.contentRect.height)

      console.log(observedWidth, "--", observedHeight)
    })

    if (element) {
      resizeObserver.observe(element)
    }

    return () => resizeObserver.disconnect()
  }, [w, h, margins])

  return [
    ref,
    combineChartDimensions({
      width: w || observedWidth,
      height: h || observedHeight,
      margins,
    }),
  ]
}
