import * as React from "react"

export const ChartConfig: React.FC<{ id: string }> = (props) => {
  return (
    <div>
      <span>{props.id}</span>
    </div>
  )
}
