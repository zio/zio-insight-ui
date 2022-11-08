import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import { pipe } from "@tsplus/stdlib/data/Function";
import * as Request from '@core/request'
import * as Codec from '@core/codecs'
import { Tag } from '@tsplus/stdlib/service/Tag';
import * as Log from '@core/logger'
import staticKeys from "@data/keys.json"
import staticStates from "@data/state.json"

type ZIOApiError = Request.FetchError | Request.InvalidJsonResponse | Codec.InvalidMetricKeys | Codec.InvalidMetricStates

// As a best practice, do not require services in the individual methods of the interface
// Rather, use Layer injection into the actual service 
export interface ZIOMetrics {
  getMetricKeys: T.Effect<never, ZIOApiError, Codec.MetricKey[]>
  getMetricStates: (ids: string[]) => T.Effect<never,ZIOApiError, Codec.MetricState[]>
}

const ZIOMetrics = Tag<ZIOMetrics>()

// helper function to construct a ZIOMetrics implementation on top of a Log Service 
// instance
function makeLiveMetrics(logger: Log.LogService) : ZIOMetrics {
  return ({
    getMetricKeys: pipe(
      Request.request("http://127.0.0.1:8080/insight/keys"),
      T.flatMap(Request.jsonFromResponse),
      T.flatMap(Codec.metricKeysFromInsight),
      T.tap(keys => logger.info(`Got ${keys.length} metric keys from server`))
    ),
    getMetricStates: (_ : string[]) => T.succeed(<Codec.MetricState[]>[])
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
        T.flatMap(Codec.metricKeysFromInsight)
      ),
      getMetricStates: (keyIds : string[]) => pipe(
        T.succeed(staticStates),
        T.flatMap(Codec.metricStatesFromInsight)
      )
    })
  )

export const getMetricKeys = T.serviceWithEffect(ZIOMetrics, api => api.getMetricKeys)

export const getMetricStates = (keyIds : string[]) => T.serviceWithEffect(ZIOMetrics, api => api.getMetricStates(keyIds))
