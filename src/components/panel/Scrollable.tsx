import * as React from "react"

// Just a simple component to eat up the given space a single cell of a flex layout
// and place a scrollable item in it. This will constrain the scrolling to this
// particular cell.
export const Scrollable: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <div className="grow place-items-stretch relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-auto">
        {props.children}
      </div>
    </div>
  )
}
