import * as React from "react"

export interface CircleProps<T> {
  data: T
  r: number
  cx: number
  cy: number
}

export function Circle<T>(): React.FC<CircleProps<T>> {
  return (props) => {
    return <circle r={props.r} cx={props.cx} cy={props.cy} />
  }
}
