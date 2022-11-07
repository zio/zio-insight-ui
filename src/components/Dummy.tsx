import * as React from "react"

export const Dummy: React.FC<{ title: string }> = (props) => {
  return (
    <div className="w-full grid place-content-center">
      <span className="text-6xl underline">{props.title}</span>
    </div>
  )
}
