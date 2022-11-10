import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import { pipe } from "@tsplus/stdlib/data/Function";
import * as Req from '@core/Request'
import { Tag } from '@tsplus/stdlib/service/Tag';
import * as Log from '@core/Logger'
import staticKeys from "@data/keys.json"
import staticStates from "@data/state.json"
import { InvalidMetricKeys, InsightKey, metricKeysFromInsight } from "@core/metrics/model/MetricKey"
import { InvalidMetricStates, MetricState, metricStatesFromInsight } from "@core/metrics/model/MetricState"

type InsightApiError = Req.FetchError | Req.InvalidJsonResponse | InvalidMetricKeys | InvalidMetricStates

// As a best practice, do not require services in the individual methods of the interface
// Rather, use Layer injection into the actual service 
export interface InsightMetrics {
  getMetricKeys: T.Effect<never, InsightApiError, InsightKey[]>
  getMetricStates: (ids: string[]) => T.Effect<never,InsightApiError, MetricState[]>
}

const InsightMetrics = Tag<InsightMetrics>()

// helper function to construct a ZIOMetrics implementation on top of a Log Service 
// instance
function makeLiveMetrics(logger: Log.LogService) : InsightMetrics {
  return ({
    getMetricKeys: pipe(
      Req.request("http://127.0.0.1:8080/insight/keys"),
      T.flatMap(Req.jsonFromResponse),
      T.flatMap(metricKeysFromInsight),
      T.tap(keys => logger.info(`Got ${keys.length} metric keys from server`))
    ),
    getMetricStates: (_ : string[]) => T.succeed(<MetricState[]>[])
  })
}

// Define a Layer with Dependency on a Log Service
export const InsightMetricsLive : L.Layer<Log.LogService, never, InsightMetrics> = 
  L.fromEffect<InsightMetrics>(InsightMetrics)(
    pipe(
      T.service<Log.LogService>(Log.LogService),
      T.map(makeLiveMetrics)
    )
  )

export const InsightMetricsStatic : L.Layer<never, never, InsightMetrics> = 
  L.fromEffect<InsightMetrics>(InsightMetrics)(
    T.succeed({
      getMetricKeys : pipe(
        T.succeed(staticKeys),
        T.flatMap(metricKeysFromInsight)
      ),
      getMetricStates: (keyIds : string[]) => pipe(
        T.succeed(staticStates),
        T.flatMap(metricStatesFromInsight), 
        T.map(states => states.filter(s => keyIds.findIndex(el => el === s.id) !== -1 ))
      )
    })
  )

export const getMetricKeys = T.serviceWithEffect(InsightMetrics, api => api.getMetricKeys)

export const getMetricStates = (keyIds : string[]) => T.serviceWithEffect(InsightMetrics, api => api.getMetricStates(keyIds))
