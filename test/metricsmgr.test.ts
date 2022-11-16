import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as F from "@effect/core/io/Fiber"
import * as MM from "@core/metrics/service/MetricsManager"
import * as Insight from "@core/metrics/service/InsightService"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as AL from "@core/AppLayer"
import * as Model from "@core/metrics/model/MetricKey"
import { pipe } from "@tsplus/stdlib/data/Function"

const testRt = AL.unsafeMakeRuntime(
  AL.appLayerStatic
).runtime

const newKeys = C.make(<Model.InsightKey>{
  id: "1234-5678",
  key: <Model.MetricKey>{
    name: "foo",
    labels: [],
    metricType: "Counter"      
  }
})

describe("MetricsManager", () => {

  it("can be reset", async () => {

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        yield* $(mm.reset())
        const keys = yield* $(mm.registeredKeys())

        return C.isEmpty(keys)
      })
    )

    expect(res).toBe(true)
  })

  it("should allow to register keys", async () => {

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const id = yield* $(mm.createSubscription(newKeys))
        const res = yield* $(mm.registeredKeys())
        yield* $(mm.removeSubscription(id))
        return res
      })
    )

    const mbElem = C.find<Model.InsightKey>(e => e.id == "1234-5678")(res)
    expect(res.length).toEqual(1)
    expect(mbElem._tag).toEqual("Some")
  })

  it("should allow to remove a subscription", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const id = yield* $(mm.createSubscription(newKeys))
        yield* $(mm.removeSubscription(id))
        const res = yield* $(mm.registeredKeys())
        return res
      })
    )

    expect(C.isEmpty(res)).toBe(true)
  })

  it("should only yield distinct keys", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const id1 = yield* $(mm.createSubscription(newKeys))
        const id2 = yield* $(mm.createSubscription(newKeys))
        const res = yield* $(mm.registeredKeys())
        yield* $(mm.removeSubscription(id1))
        yield* $(mm.removeSubscription(id2))
        return res
      })
    )

    expect(C.size(res)).toBe(1)
  })

  it("should publish metric state updates", async () => {

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const insight = yield* $(T.service(Insight.InsightMetrics))
        const mm = yield* $(T.service(MM.MetricsManager))

        const keys = yield* $(
          pipe(
            insight.getMetricKeys,
            T.catchAll(_ => 
              T.sync(() => <Model.InsightKey[]>[])
            )
          )          
        )

        const sub = yield* $(mm.createSubscription(C.from(keys)))
        const states = yield* $(mm.updates())

        // Make sure we are already consuming from the stream before we manually kick off 
        // the polling 
        const f = yield* $(
          pipe(
            S.take(10)(states),
            S.runCollect,
            T.fork
          )
        )

        yield* $(mm.poll())

        // Now the fiber should be done and have the first 10 elements from the state 
        // updates
        const res = yield* $(F.join(f))
        yield* $(mm.removeSubscription(sub))

        return res
      })
    )

    expect(res.length).toEqual(10)
  })
})