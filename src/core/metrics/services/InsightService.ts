import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import { pipe } from "@tsplus/stdlib/data/Function"
import * as Req from '@core/services/Request'
import { Tag } from '@tsplus/stdlib/service/Tag'
import * as Log from '@core/services/Logger'
import staticKeys from "@data/keys.json"
import staticStates from "@data/state.json"
import staticFibers from "@data/sampleFibers.json"
import { InvalidMetricKeys, InsightKey, metricKeysFromInsight } from "@core/metrics/model/zio/metrics/MetricKey"
import { InvalidMetricStates, MetricState, metricStatesFromInsight } from "@core/metrics/model/zio/metrics/MetricState"
import { InvalidFibers ,FiberInfo, fibersFromInsight } from "@core/metrics/model/insight/fibers/FiberInfo"

const baseUrl = "http://127.0.0.1:8080/insight"

type InsightApiError = Req.FetchError | Req.InvalidJsonResponse | InvalidMetricKeys | InvalidMetricStates | InvalidFibers

// As a best practice, do not require services in the individual methods of the interface
// Rather, use Layer injection into the actual service 
export interface InsightService {
  getMetricKeys: T.Effect<never, InsightApiError, InsightKey[]>
  getMetricStates: (ids: string[]) => T.Effect<never,InsightApiError, MetricState[]>

  getFibers: T.Effect<never, InsightApiError, FiberInfo[]>
}

export const InsightService = Tag<InsightService>()

interface StateRequest { 
  selection: string[]
}

// helper function to construct a ZIOMetrics implementation on top of a Log Service 
// instance
function makeLiveMetrics(logger: Log.LogService) : InsightService {
  return ({
    getMetricKeys: pipe(
      Req.request(`${baseUrl}/metrics/keys`),
      T.flatMap(Req.jsonFromResponse),
      T.flatMap(metricKeysFromInsight),
      T.tap(keys => logger.info(`Got ${keys.length} metric keys from server`))
    ),
    getMetricStates: (keys : string[]) => 
      T.gen(function* ($) {
        const req = <StateRequest>{selection: keys}
        const raw = yield* $(Req.request(`${baseUrl}/metrics/metrics`, { method: "POST", body: JSON.stringify(req)}))
        const json = yield* $(Req.jsonFromResponse(raw))
        
        return yield* $(metricStatesFromInsight(json))
      }),
    getFibers: pipe(
      Req.request(`${baseUrl}/fibers/fibers`),
      T.flatMap(Req.jsonFromResponse),
      T.flatMap(fibersFromInsight),
      T.tap(fibers => logger.info(`Got ${fibers.length} fiber infos from server`))
    )
  })
}

// Define a Layer with Dependency on a Log Service
export const live : L.Layer<Log.LogService, never, InsightService> = 
  L.fromEffect(InsightService)(
    pipe(
      T.service(Log.LogService),
      T.map(makeLiveMetrics)
    )
  )

export const dev : L.Layer<never, never, InsightService> = 
  L.fromEffect(InsightService)(
    T.succeed({
      getMetricKeys : pipe(
        T.succeed(staticKeys),
        T.flatMap(metricKeysFromInsight)
      ),
      getMetricStates: (keyIds : string[]) => pipe(
        T.succeed(staticStates),
        T.flatMap(metricStatesFromInsight), 
        T.map(states => states.filter(s => keyIds.findIndex(el => el === s.id) !== -1 ))
      ),
      getFibers:pipe(
        T.succeed(staticFibers),
        T.flatMap(fibersFromInsight)
      )        
    })
  )

export const getMetricKeys = T.serviceWithEffect(InsightService, api => api.getMetricKeys)

export const getMetricStates = (keyIds : string[]) => T.serviceWithEffect(InsightService, api => api.getMetricStates(keyIds))
