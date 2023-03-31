import * as React from "react"

export interface CircleProps<T> {
  data: T
}

export function Circle<T>(
  props: CircleProps<T> & React.SVGProps<SVGCircleElement>
): React.ReactElement<React.PropsWithChildren> {
  {
    return React.createElement("circle", props)
  }
}
