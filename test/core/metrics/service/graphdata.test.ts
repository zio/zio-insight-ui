import * as T from "@effect/core/io/Effect"
import * as F from "@effect/core/io/Fiber"
import * as S from "@effect/core/stream/Stream"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as HSet from "@tsplus/stdlib/collections/HashSet"
import { pipe } from "@tsplus/stdlib/data/Function"

import * as AL from "@core/AppLayer"
import * as GDS from "@core/metrics/services/GraphDataService"
import * as MM from "@core/metrics/services/MetricsManager"
import * as Log from "@core/services/Logger"

import * as TK from "../../../../src/data/testkeys"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.Off)).runtime

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

        const f = yield* $(pipe(S.take(1)(data), S.runCollect, T.fork))

        yield* $(mm.poll())
        const res = yield* $(F.join(f))
        yield* $(svc.close())

        return res
      })
    )

    expect(C.size(res)).toBe(1)
  })

  it("should drop timeseries when the corresponding metric key has been removed", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const svc = yield* $(gds)

        const ck = yield* $(TK.counterKey)
        const gk = yield* $(TK.gaugeKey)

        const data = yield* $(svc.data())
        yield* $(svc.setMetrics(ck, gk))

        const f = yield* $(pipe(S.take(1)(data), S.runCollect, T.fork))

        yield* $(mm.poll())
        // We wait until the GDS has been updated
        yield* $(F.join(f))

        yield* $(svc.setMetrics(ck))
        yield* $(svc.close())

        return yield* $(svc.current())
      })
    )

    expect(HMap.size(res)).toEqual(1)
  })
})
