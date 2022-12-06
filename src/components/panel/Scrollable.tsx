import * as React from "react"

export const Scrollable: React.FC<{ children: React.ReactNode }> = (props) => {
  return (
    <div className="grow place-items-stretch relative">
      <div className="absolute top-0 left-0 w-full h-full overflow-y-auto">
        {props.children}
      </div>
    </div>
  )
}
