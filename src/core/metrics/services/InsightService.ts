import staticKeys from "@data/keys.json"
import staticFibers from "@data/sampleFibers.json"
import staticStates from "@data/state.json"
import * as C from "@effect/data/Chunk"
import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as HS from "@effect/data/HashSet"
import * as T from "@effect/io/Effect"
import * as L from "@effect/io/Layer"
import { Request } from "@services/Services"

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

const baseUrl = "http://127.0.0.1:8080/insight"

type InsightApiError =
  | Request.FetchError
  | Request.InvalidJsonResponse
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

  fiberTrace: (f: FiberInfo) => T.Effect<never, InsightApiError, FiberInfo>
}

export const InsightService = Ctx.Tag<InsightService>()

interface StateRequest {
  selection: readonly string[]
}

// helper function to construct a ZIOMetrics implementation on top of a Log Service
// instance
function makeLiveMetrics(): InsightService {
  return {
    getMetricKeys: pipe(
      Request.request(`${baseUrl}/metrics/keys`),
      T.flatMap(Request.jsonFromResponse),
      T.flatMap(metricKeysFromInsight),
      T.tap((keys) => T.logInfo(`Got ${HS.size(keys)} metric keys from server`))
    ),
    getMetricStates: (keys: readonly string[]) =>
      T.gen(function* ($) {
        const req: StateRequest = { selection: keys }
        const raw = yield* $(
          Request.request(`${baseUrl}/metrics/metrics`, {
            method: "POST",
            body: JSON.stringify(req),
          })
        )
        const json = yield* $(Request.jsonFromResponse(raw))

        return yield* $(metricStatesFromInsight(json))
      }),
    getFibers: pipe(
      Request.request(`${baseUrl}/fibers/fibers`),
      T.flatMap(Request.jsonFromResponse),
      T.flatMap(fibersFromInsight),
      T.tap((fibers) => T.logInfo(`Got ${fibers.length} fiber infos from server`))
    ),
    fiberTrace: (f: FiberInfo) => T.succeed(f),
  }
}

// Define a Layer with Dependency on a Log Service
export const live: L.Layer<never, never, InsightService> = L.effect(
  InsightService,
  T.succeed(makeLiveMetrics())
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
    fiberTrace: (f: FiberInfo) => T.succeed(f),
  })
)

export const getMetricKeys = T.flatMap(InsightService, (api) => api.getMetricKeys)

export const getMetricStates = (keyIds: string[]) =>
  T.flatMap(InsightService, (api) => api.getMetricStates(keyIds))

export const getFibers = T.flatMap(InsightService, (api) => api.getFibers)
