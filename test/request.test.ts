import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import * as Log from '@core/logger'
import * as Api from '@core/api'
import { pipe } from '@tsplus/stdlib/data/Function'

const layer : L.Layer<never, never, Api.ZIOMetrics> = pipe(
  Log.consoleLogger,
  L.provideTo(Api.ZIOLive)
)

describe("Request", () => {
  it("should simply get something", async () => {

    const res = await T.unsafeRunPromise(
      pipe(
        Api.getMetricKeys,
        T.provideSomeLayer(layer)
      )
    )
    
    expect(res.length).toBeGreaterThan(0)
  })
})
