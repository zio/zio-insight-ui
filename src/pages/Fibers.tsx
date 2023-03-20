import * as React from "react"
import * as T from "@effect/core/io/Effect"
import * as App from "@components/App"
import { FiberInfo } from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Insight from "@core/metrics/services/InsightService"

export const Fibers: React.FC<{}> = () => {
  const appRt = React.useContext(App.RuntimeContext)

  const [fibers, setFibers] = React.useState<FiberInfo[]>([])

  React.useEffect(() => {
    appRt
      .unsafeRunPromise(
        T.gen(function* ($) {
          const insight = yield* $(T.service(Insight.InsightService))
          const fibers = yield* $(insight.getFibers)
          return fibers
        })
      )
      .then((fibers) => setFibers(fibers))
  }, [])

  return <h1>{fibers.length}</h1>
}
