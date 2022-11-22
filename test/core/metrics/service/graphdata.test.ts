import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as F from "@effect/core/io/Fiber"
import * as AL from "@core/AppLayer"
import * as HSet from "@tsplus/stdlib/collections/HashSet"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as GDS from "@core/metrics/service/GraphDataService"
import * as MM from "@core/metrics/service/MetricsManager"
import * as TK from  "../../../../src/data/testkeys"
import { pipe } from "@tsplus/stdlib/data/Function"

const testRt = AL.unsafeMakeRuntime(
  AL.appLayerStatic
).runtime

const gds = GDS.createGraphDataService()

describe("GraphDataService", () => {

  it("should start with an empty set of keys", async () => {

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const svc = yield* $(gds)
        yield* $(svc.close())
        return yield* $(svc.metrics())
      })
    )

    expect(HSet.size(res)).toEqual(0)
  })

  it("should allow to register keys for observation", async () => {

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const svc = yield* $(gds)
        const counterKey = yield* $(TK.counterKey)
        const gaugeKey = yield* $(TK.gaugeKey)
        yield* $(svc.setMetrics(counterKey, gaugeKey, counterKey))
        yield* $(svc.close())
        return yield* $(svc.metrics())
      })
    )

    // Should ignore duplicates
    expect(HSet.size(res)).toEqual(2)
  })

  it("should start with the default number of max entries", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const svc = yield* $(gds)
        yield* $(svc.close())
        return yield* $(svc.maxEntries())
      })
    )

    // Should ignore duplicates
    expect(res).toEqual(GDS.defaultMaxEntries)
  })

  it("should push updates to relevant timeseries", async () => {
    
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const svc = yield* $(gds)
        const counterKey = yield* $(TK.counterKey)

        const data = yield* $(svc.data())
        yield* $(svc.setMetrics(counterKey))

        const f = yield* $(
          pipe(
            S.take(1)(data),
            S.runCollect,
            T.fork
          )
        )

        yield* $(mm.poll())
        const res = yield* $(F.join(f))
        yield* $(svc.close())

        return res
      })
    )

    expect(C.size(res)).toBe(1)
  })
})