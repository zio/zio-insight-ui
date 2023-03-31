import { ResizeObserver } from "@juggle/resize-observer"
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

  const [currentDms, changeDms] = React.useState(emptyDimensions)

  React.useEffect(() => {
    const element = ref.current

    if (w && h) {
      changeDms(combineChartDimensions({ width: w, height: h, margins }))
      return
    } else {
      const resizeObserver = new ResizeObserver(
        (entries: Array<ResizeObserverEntry>) => {
          if (entries.length == 0) return
          const entry = entries[0]

          if (
            currentDms.width != entry.contentRect.width ||
            currentDms.height != entry.contentRect.height
          ) {
            changeDms(
              combineChartDimensions({
                width: entry.contentRect.width,
                height: entry.contentRect.height,
                margins,
              })
            )
          }
        }
      )

      if (element) {
        resizeObserver.observe(element, { box: "content-box" })
      }

      return () => resizeObserver.disconnect()
    }
  }, [ref, w, h, margins])

  return [ref, currentDms]
}
