import * as T from '@effect/core/io/Effect'
import { pipe } from "@tsplus/stdlib/data/Function";
import * as Request from '@core/request'
import * as Codec from '@core/codecs'

export const getMetricKeys = pipe(
  pipe(
    // Dont use localhost as this resolves with IPv6
    Request.request("http://127.0.0.1:8080/insight/keys"),
    T.flatMap(Request.jsonFromResponse),
    T.flatMap(Codec.fromInsight)
  )
)