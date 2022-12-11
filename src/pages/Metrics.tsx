import * as React from "react"
import { GridFrame } from "@components/panel/GridFrame"
import { ChartConfig } from "@components/panel/ChartConfigPanel"

export function Metrics() {
  return (
    <GridFrame
      id="foo"
      title="bar"
      configMode={true}
      maximized={false}
      closePanel={() => {}}
      configure={() => {}}
      maximize={() => {}}
      content={<></>}
      config={<ChartConfig id="foo" />}></GridFrame>
  )
}
