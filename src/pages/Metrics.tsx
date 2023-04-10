import { ChartConfigPanel } from "@components/chart/ChartConfigPanel"
import { GridFrame } from "@components/gridframe/GridFrame"
import * as Option from "@effect/data/Option"
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
          id={Option.none()}
          onDone={(_) => {
            /* ignore */
          }}
        />
      }
    ></GridFrame>
  )
}
