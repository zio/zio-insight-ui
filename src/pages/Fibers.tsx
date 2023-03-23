import * as App from "@components/App"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"
import * as React from "react"

import type { FiberInfo } from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

export const Fibers: React.FC<{}> = () => {
  const appRt = React.useContext(App.RuntimeContext)

  const [fibers, setFibers] = React.useState<FiberInfo[]>([])

  React.useEffect(() => {
    RT.runPromise(appRt)(
      T.gen(function* ($) {
        const insight = yield* $(T.service(Insight.InsightService))
        const fibers = yield* $(insight.getFibers)
        return fibers
      })
    ).then((fibers) => setFibers(fibers))
  }, [])

  return <h1>{fibers.length}</h1>
}
