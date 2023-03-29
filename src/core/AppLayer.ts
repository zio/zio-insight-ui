import { pipe } from "@effect/data/Function"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Layer from "@effect/io/Layer"
import * as Log from "@effect/io/Logger"
import * as LogLevel from "@effect/io/Logger/Level"
import * as Scope from "@effect/io/Scope"

import * as FDSvc from "@core/metrics/services/FiberDataService"
import * as GDM from "@core/metrics/services/GraphDataManager"
import * as MM from "@core/metrics/services/MetricsManager"
import * as IdSvc from "@core/services/IdGenerator"

import * as Insight from "./metrics/services/InsightService"

export type AppLayer =
  | Insight.InsightService
  | MM.MetricsManager
  | IdSvc.IdGenerator
  | GDM.GraphDataManager
  | FDSvc.FiberDataService

export const appLayerLive = pipe(
  IdSvc.live,
  Layer.provideMerge(Log.minimumLogLevel(LogLevel.Debug)),
  Layer.provideMerge(Insight.live),
  Layer.provideMerge(MM.live),
  Layer.provideMerge(GDM.live),
  Layer.provideMerge(FDSvc.live)
)

export const appLayerStatic = pipe(
  IdSvc.live,
  Layer.provideMerge(Log.minimumLogLevel(LogLevel.Debug)),
  Layer.provideMerge(Insight.dev),
  Layer.provideMerge(MM.live),
  Layer.provideMerge(GDM.live),
  Layer.provideMerge(FDSvc.live)
)

const appRuntime = <R, E, A>(layer: Layer.Layer<R, E, A>) =>
  Effect.gen(function* ($) {
    const scope = yield* $(Scope.make())
    const env = yield* $(Layer.buildWithScope(scope)(layer))
    const runtime = yield* $(pipe(Effect.runtime<A>(), Effect.provideContext(env)))

    return {
      runtime,
      clean: Scope.close(scope, Exit.unit()),
    }
  })

export const unsafeMakeRuntime = <E, A>(layer: Layer.Layer<never, E, A>) =>
  Effect.runSync(appRuntime(layer))
