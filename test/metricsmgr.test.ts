import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as MM from "@core/metrics/service/MetricsManager"
import * as C from "@tsplus/stdlib/collections/Chunk"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as AL from "@core/AppLayer"
import * as Log from "@core/services/Logger"
import * as Model from "@core/metrics/model/MetricKey"
import * as IdSvc from "@core/services/IdGenerator"

const testRt = pipe(
  Log.LoggerLive,
  L.provideToAndMerge(IdSvc.live),
  L.provideToAndMerge(MM.live),
  AL.unsafeMakeRuntime
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

  it("should start empty", async () => {

    const res = await testRt.unsafeRunPromise(
      pipe(
        T.service(MM.MetricsManager),
        T.flatMap(mm => mm.registeredKeys()),
        T.map(C.isEmpty)
      )      
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
})