import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import { pipe } from "@tsplus/stdlib/data/Function";
import * as Request from '@core/request'
import * as Codec from '@core/codecs'
import { Tag } from '@tsplus/stdlib/service/Tag';
import * as Log from '@core/logger'

type ZIOApiError = Request.FetchError | Request.InvalidJsonResponse | Codec.InvalidMetricKeys

export interface ZIOMetrics {
  getMetricKeys: T.Effect<never, ZIOApiError, Codec.MetricKey[]>
}

const ZIOMetrics = Tag<ZIOMetrics>()

function makeMetrics(logger: Log.LogService) : ZIOMetrics {
  return ({
    getMetricKeys: pipe(
      Request.request("http://127.0.0.1:8080/insight/keys"),
      T.flatMap(Request.jsonFromResponse),
      T.flatMap(Codec.fromInsight),
      T.tap(keys => logger.info(`Got ${keys.length} metric keys from server`))
  )
  })
}

export const ZIOLive : L.Layer<Log.LogService, never, ZIOMetrics> = 
  L.fromEffect<ZIOMetrics>(ZIOMetrics)(
    pipe(
      T.service<Log.LogService>(Log.LogService),
      T.map(makeMetrics)
    )
  )

export const getMetricKeys = T.serviceWithEffect(ZIOMetrics, api => api.getMetricKeys)

