import * as T from '@effect/core/io/Effect'
import * as Api from '@core/api'
import { appLayerStatic } from '@core/AppLayer'
import { pipe } from '@tsplus/stdlib/data/Function'

describe("Request", () => {
  it("should be able to get the metric keys", async () => {

    const res = await T.unsafeRunPromise(
      pipe(
        Api.getMetricKeys,
        T.provideSomeLayer(appLayerStatic)
      )
    )
    
    expect(res.length).toBeGreaterThan(0)
  })

  it("should be able to get the states for a given set of keys", async () => {

    const res = await T.unsafeRunPromise(
      pipe(
        Api.getMetricStates(<string[]>["14f12b03-adfd-305d-ba50-631fbdfdeb62"]),
        T.provideSomeLayer(appLayerStatic)
      )
    )

    console.log(JSON.stringify(res, null, 2))

    expect(res.length).toEqual(1)
  })
})
