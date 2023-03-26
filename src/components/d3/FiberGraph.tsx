import * as App from "@components/App"
import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"
import type * as d3 from "d3"
import * as React from "react"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

import type { SvgGeometry } from "./SvgGeometry"
import { SVGPanel } from "./SvgPanel"

export const FiberGraph: React.FC<{}> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)

  const [fibers, setFibers] = React.useState<F.FiberInfo[]>([])

  const fetchFibers = () => {
    return T.gen(function* ($) {
      const fibers = yield* $(
        pipe(
          Insight.getFibers,
          T.catchAll((_) => T.succeed([] as F.FiberInfo[]))
        )
      )
      yield* $(T.logDebug(`Got ${fibers.length} fibers from application`))
      return fibers
    })
  }

  React.useEffect(() => {
    RT.runPromise(appRt)(fetchFibers()).then((fibers) => setFibers(fibers))
  }, [])

  const rect = (
    canvas: d3.Selection<SVGGElement, unknown, null, undefined>,
    geom: SvgGeometry
  ) =>
    canvas
      .append("rect")
      .attr("x", 0)
      .attr("y", 0)
      .attr("width", geom.svgWidth)
      .attr("height", geom.svgHeight)
      .attr("fill", "yellow")
      .attr("stroke", "black")
      .attr("stroke-width", "3")

  return <SVGPanel scale={[0.5, 3]} content={rect} />
}
