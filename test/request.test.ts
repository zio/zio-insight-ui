import * as T from '@effect/core/io/Effect'
import * as Api from '@core/api'
import { appLayer } from '@core/layer'
import { pipe } from '@tsplus/stdlib/data/Function'

describe("Request", () => {
  it("should simply get something", async () => {

    const res = await T.unsafeRunPromise(
      pipe(
        Api.getMetricKeys,
        T.provideSomeLayer(appLayer)
      )
    )
    
    expect(res.length).toBeGreaterThan(0)
  })
})
