import staticKeys from "@data/keys.json"
import staticFibers from "@data/sampleFibers.json"
import staticStates from "@data/state.json"
import * as C from "@effect/data/Chunk"
import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as HS from "@effect/data/HashSet"
import * as T from "@effect/io/Effect"
import * as L from "@effect/io/Layer"

import type {
  FiberInfo,
  InvalidFibers,
} from "@core/metrics/model/insight/fibers/FiberInfo"
import { fibersFromInsight } from "@core/metrics/model/insight/fibers/FiberInfo"
import type {
  InsightKey,
  InvalidMetricKeys,
} from "@core/metrics/model/zio/metrics/MetricKey"
import { metricKeysFromInsight } from "@core/metrics/model/zio/metrics/MetricKey"
import type {
  InvalidMetricStates,
  MetricState,
} from "@core/metrics/model/zio/metrics/MetricState"
import { metricStatesFromInsight } from "@core/metrics/model/zio/metrics/MetricState"
import * as Log from "@core/services/Logger"
import * as Req from "@core/services/Request"

const baseUrl = "http://127.0.0.1:8080/insight"

type InsightApiError =
  | Req.FetchError
  | Req.InvalidJsonResponse
  | InvalidMetricKeys
  | InvalidMetricStates
  | InvalidFibers

// As a best practice, do not require services in the individual methods of the interface
// Rather, use Layer injection into the actual service
export interface InsightService {
  getMetricKeys: T.Effect<never, InsightApiError, HS.HashSet<InsightKey>>
  getMetricStates: (
    ids: readonly string[]
  ) => T.Effect<never, InsightApiError, C.Chunk<MetricState>>

  getFibers: T.Effect<never, InsightApiError, FiberInfo[]>
}

export const InsightService = Ctx.Tag<InsightService>()

interface StateRequest {
  selection: readonly string[]
}

// helper function to construct a ZIOMetrics implementation on top of a Log Service
// instance
function makeLiveMetrics(logger: Log.LogService): InsightService {
  return {
    getMetricKeys: pipe(
      Req.request(`${baseUrl}/metrics/keys`),
      T.flatMap(Req.jsonFromResponse),
      T.flatMap(metricKeysFromInsight),
      T.tap((keys) => logger.info(`Got ${HS.size(keys)} metric keys from server`))
    ),
    getMetricStates: (keys: readonly string[]) =>
      T.gen(function* ($) {
        const req: StateRequest = { selection: keys }
        const raw = yield* $(
          Req.request(`${baseUrl}/metrics/metrics`, {
            method: "POST",
            body: JSON.stringify(req),
          })
        )
        const json = yield* $(Req.jsonFromResponse(raw))

        return yield* $(metricStatesFromInsight(json))
      }),
    getFibers: pipe(
      Req.request(`${baseUrl}/fibers/fibers`),
      T.flatMap(Req.jsonFromResponse),
      T.flatMap(fibersFromInsight),
      T.tap((fibers) => logger.info(`Got ${fibers.length} fiber infos from server`))
    ),
  }
}

// Define a Layer with Dependency on a Log Service
export const live: L.Layer<Log.LogService, never, InsightService> = L.effect(
  InsightService,
  pipe(T.service(Log.LogService), T.map(makeLiveMetrics))
)

export const dev: L.Layer<never, never, InsightService> = L.effect(
  InsightService,
  T.succeed({
    getMetricKeys: pipe(T.succeed(staticKeys), T.flatMap(metricKeysFromInsight)),
    getMetricStates: (keyIds: readonly string[]) =>
      pipe(
        T.succeed(staticStates),
        T.flatMap(metricStatesFromInsight),
        T.map((states) =>
          C.filter(states, (s) => keyIds.findIndex((el) => el === s.id) !== -1)
        )
      ),
    getFibers: pipe(T.succeed(staticFibers), T.flatMap(fibersFromInsight)),
  })
)

export const getMetricKeys = T.serviceWithEffect(
  InsightService,
  (api) => api.getMetricKeys
)

export const getMetricStates = (keyIds: string[]) =>
  T.serviceWithEffect(InsightService, (api) => api.getMetricStates(keyIds))
