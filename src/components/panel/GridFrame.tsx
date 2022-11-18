import * as React from "react"

interface GridFrameProps {
  children?: React.ReactNode
}

export const GridFrame: React.FC<GridFrameProps> = (props) => {
  return (
    <div className="w-full h-full pl-4 bg-neutral text-neutral-content">
      {props.children}
    </div>
  )
}
