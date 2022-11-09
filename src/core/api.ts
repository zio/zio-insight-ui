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

type ZIOApiError = Req.FetchError | Req.InvalidJsonResponse | InvalidMetricKeys | InvalidMetricStates

// As a best practice, do not require services in the individual methods of the interface
// Rather, use Layer injection into the actual service 
export interface ZIOMetrics {
  getMetricKeys: T.Effect<never, ZIOApiError, InsightKey[]>
  getMetricStates: (ids: string[]) => T.Effect<never,ZIOApiError, MetricState[]>
}

const ZIOMetrics = Tag<ZIOMetrics>()

// helper function to construct a ZIOMetrics implementation on top of a Log Service 
// instance
function makeLiveMetrics(logger: Log.LogService) : ZIOMetrics {
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
export const ZIOMetricsLive : L.Layer<Log.LogService, never, ZIOMetrics> = 
  L.fromEffect<ZIOMetrics>(ZIOMetrics)(
    pipe(
      T.service<Log.LogService>(Log.LogService),
      T.map(makeLiveMetrics)
    )
  )

export const ZIOMetricsStatic : L.Layer<never, never, ZIOMetrics> = 
  L.fromEffect<ZIOMetrics>(ZIOMetrics)(
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

export const getMetricKeys = T.serviceWithEffect(ZIOMetrics, api => api.getMetricKeys)

export const getMetricStates = (keyIds : string[]) => T.serviceWithEffect(ZIOMetrics, api => api.getMetricStates(keyIds))
