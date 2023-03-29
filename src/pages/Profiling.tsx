import { FiberGraph } from "@components/d3/FiberGraph"
import { GridFrame } from "@components/panel/GridFrame"
import * as React from "react"

export function Profiling() {
  return (
    <GridFrame
      id="foo"
      title="bar"
      configMode={false}
      maximized={false}
      closePanel={(_: string) => {
        /* ignore */
      }}
      configure={() => {
        /* ignore */
      }}
      maximize={() => {
        /* ignore */
      }}
      content={<FiberGraph />}
      config={undefined}
    ></GridFrame>
  )
}
