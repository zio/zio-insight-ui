import * as C from "@effect/data/Chunk"
import * as D from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as HS from "@effect/data/HashSet"
import * as T from "@effect/io/Effect"
import * as F from "@effect/io/Fiber"
import * as RT from "@effect/io/Runtime"
import * as S from "@effect/stream/Stream"

import * as AL from "@core/AppLayer"
import type * as Model from "@core/metrics/model/zio/metrics/MetricKey"
import * as Insight from "@core/metrics/services/InsightService"
import * as MM from "@core/metrics/services/MetricsManager"
import * as Log from "@core/services/Logger"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.Debug)).runtime

const newKeys = HS.make({
  id: "1234-5678",
  key: {
    name: "foo",
    labels: [],
    metricType: "Counter",
  } as Model.MetricKey,
} as Model.InsightKey)

describe("MetricsManager", () => {
  it("can be reset", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        yield* $(mm.reset())
        const keys = yield* $(mm.registeredKeys())

        return HS.size(keys) == 0
      })
    )

    expect(res).toBe(true)
  })

  it("should allow to register keys", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const id = yield* $(mm.createSubscription(newKeys))
        const res = yield* $(mm.registeredKeys())
        yield* $(mm.removeSubscription(id))
        return res
      })
    )

    const mbElem = C.findFirst(C.fromIterable(res), (e) => e.id == "1234-5678")
    expect(HS.size(res)).toEqual(1)
    expect(mbElem._tag).toEqual("Some")
  })

  it("should allow to remove a subscription", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const mm = yield* $(T.service(MM.MetricsManager))
        const id = yield* $(mm.createSubscription(newKeys))
        yield* $(mm.removeSubscription(id))
        const res = yield* $(mm.registeredKeys())
        return res
      })
    )

    expect(HS.size(res)).toEqual(0)
  })

  it("should only yield distinct keys", async () => {
    const res = await RT.runPromise(testRt)(
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

    expect(HS.size(res)).toBe(1)
  })

  it("should publish metric state updates", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const insight = yield* $(T.service(Insight.InsightService))
        const mm = yield* $(T.service(MM.MetricsManager))

        const keys = yield* $(
          pipe(
            insight.getMetricKeys,
            T.catchAll((_) => T.sync(() => HS.empty<Model.InsightKey>()))
          )
        )

        const sub = yield* $(mm.createSubscription(keys))
        const states = yield* $(mm.updates())

        // Make sure we are already consuming from the stream before we manually kick off
        // the polling
        const f = yield* $(pipe(S.take(states, 10), S.runCollect, T.fork))

        yield* $(T.delay(D.millis(10))(mm.poll()))

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
