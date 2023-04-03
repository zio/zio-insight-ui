import * as Chunk from "@effect/data/Chunk"
import * as HashSet from "@effect/data/HashSet"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import * as Stream from "@effect/stream/Stream"

import * as AL from "@core/AppLayer"
import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FDS from "@core/metrics/services/FiberDataService"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

describe("FiberDataService", () => {
  it("allow to create a subscription", async () => {
    const [id, ids] = await Runtime.runPromise(testRt)(
      Effect.gen(function* ($) {
        const fds = yield* $(FDS.FiberDataService)
        const [id] = yield* $(fds.createSubscription())
        const ids = yield* $(fds.subscriptionIds())
        yield* $(fds.removeSubscription(id))

        return [id, ids]
      })
    )
    expect(HashSet.has(ids, id)).toBeTruthy()
  })

  it("allow to remove a subscription", async () => {
    const [id, ids] = await Runtime.runPromise(testRt)(
      Effect.gen(function* ($) {
        const fds = yield* $(FDS.FiberDataService)
        const [id] = yield* $(fds.createSubscription())
        yield* $(fds.removeSubscription(id))
        const ids = yield* $(fds.subscriptionIds())

        return [id, ids]
      })
    )
    expect(HashSet.has(ids, id)).toBeFalsy()
  })

  it("consume fiber state from an existing subscription", async () => {
    const fiberData = await Runtime.runPromise(testRt)(
      Effect.gen(function* ($) {
        const fds = yield* $(FDS.FiberDataService)
        const [id, s] = yield* $(fds.createSubscription())
        const res = yield* $(Stream.runCollect(Stream.take(1)(s)))
        yield* $(fds.removeSubscription(id))

        const data = Option.getOrElse(() => [] as F.FiberInfo[])(Chunk.head(res))
        yield* $(Effect.logInfo(`Found ${data.length} fiber data entries`))
        return res
      })
    )
    expect(Chunk.isNonEmpty(fiberData)).toBeTruthy()
  })
})
