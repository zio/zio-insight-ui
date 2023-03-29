import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as E from "@effect/io/Exit"
import * as L from "@effect/io/Layer"
import * as Log from "@effect/io/Logger"
import * as LogLevel from "@effect/io/Logger/Level"
import * as S from "@effect/io/Scope"

import * as GDM from "@core/metrics/services/GraphDataManager"
import * as MM from "@core/metrics/services/MetricsManager"
import * as IdSvc from "@core/services/IdGenerator"

import * as Insight from "./metrics/services/InsightService"

export type AppLayer =
  | Insight.InsightService
  | MM.MetricsManager
  | IdSvc.IdGenerator
  | GDM.GraphDataManager

export const appLayerLive = pipe(
  IdSvc.live,
  L.provideMerge(Log.minimumLogLevel(LogLevel.Debug)),
  L.provideMerge(Insight.live),
  L.provideMerge(MM.live),
  L.provideMerge(GDM.live)
)

export const appLayerStatic = pipe(
  IdSvc.live,
  L.provideMerge(Log.minimumLogLevel(LogLevel.Debug)),
  L.provideMerge(Insight.dev),
  L.provideMerge(MM.live),
  L.provideMerge(GDM.live)
)

const appRuntime = <R, E, A>(layer: L.Layer<R, E, A>) =>
  T.gen(function* ($) {
    const scope = yield* $(S.make())
    const env = yield* $(L.buildWithScope(scope)(layer))
    const runtime = yield* $(pipe(T.runtime<A>(), T.provideContext(env)))

    return {
      runtime,
      clean: S.close(scope, E.unit()),
    }
  })

export const unsafeMakeRuntime = <E, A>(layer: L.Layer<never, E, A>) =>
  T.runSync(appRuntime(layer))
