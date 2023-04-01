import { SimpleForceGraph } from "@components/d3/SimpleForceGraph"
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
      content={<SimpleForceGraph />}
      config={undefined}
    ></GridFrame>
  )
}
