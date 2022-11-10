import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as S from "@effect/core/io/Scope"
import * as E from "@effect/core/io/Exit"
import { InsightMetricsLive, InsightMetrics, InsightMetricsStatic } from "./metrics/service/InsightService"
import { ConsoleService, LoggerLive, LogService } from "./Logger"
import { pipe } from "@tsplus/stdlib/data/Function"

export type AppLayer = ConsoleService | LogService | InsightMetrics

export const appLayerLive : L.Layer<never, never, AppLayer> = pipe(
  LoggerLive,
  L.provideToAndMerge(InsightMetricsLive)
)

export const appLayerStatic : L.Layer<never, never, AppLayer> = pipe(
  LoggerLive,
  L.merge(InsightMetricsStatic)
)
  

const appRuntime = <R, E, A>(layer: L.Layer<R, E, A>) => 
  T.gen(function*($) {
    const scope = yield* $(S.make)
    const env = yield* $(L.buildWithScope(scope)(layer))
    const runtime = yield* $(pipe(T.runtime<A>(), T.provideEnvironment(env)))

    return { 
      runtime, 
      clean: S.close(E.unit)(scope)
    }
  })
  
export const unsafeMakeRuntime = <E,A>(layer: L.Layer<never, E, A>) =>
  T.unsafeRunSync(appRuntime(layer))