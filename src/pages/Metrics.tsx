import { ChartConfigPanel } from "@components/panel/ChartConfigPanel"
import { GridFrame } from "@components/panel/GridFrame"
import * as React from "react"

export function Metrics() {
  return (
    <GridFrame
      id="foo"
      title="bar"
      configMode={true}
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
      content={<></>}
      config={
        <ChartConfigPanel
          id="foo"
          onDone={(_) => {
            /* ignore */
          }}
        />
      }
    ></GridFrame>
  )
}
