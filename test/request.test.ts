import * as T from '@effect/core/io/Effect'
import * as Api from '@core/api'

describe("Request", () => {
  it("should simply get something", async () => {

    const res = await T.unsafeRunPromise(
      Api.getMetricKeys
    )

    console.log(res)
    expect(res.length).toBeGreaterThan(0)
  })
})
