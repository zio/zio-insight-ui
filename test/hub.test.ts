import * as C from "@effect/data/Chunk"
import * as D from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as F from "@effect/io/Fiber"
import * as H from "@effect/io/Hub"
import * as Sch from "@effect/io/Schedule"
import * as S from "@effect/stream/Stream"

describe("PlayHub", () => {
  it("should consume messages from a hub", async () => {
    const n = 2
    const res = await T.runPromise(
      T.gen(function* ($) {
        const hub = yield* $(H.unbounded<string>())

        const stream = pipe(
          S.fromHub(hub),
          S.take(n),
          S.mapEffect((s) => T.log(`ooo: ${s}`))
        )

        const f1 = yield* $(pipe(S.runCollect(stream), T.fork))
        yield* $(
          pipe(T.schedule(Sch.spaced(D.millis(100)))(hub.publish("hello")), T.fork)
        )

        return yield* $(F.join(f1))
      })
    )

    expect(C.size(res)).toEqual(n)
  })
})
