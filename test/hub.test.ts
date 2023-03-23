import * as C from "@effect/data/Chunk"
import * as D from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as T from "@effect/io/Effect"
import * as F from "@effect/io/Fiber"
import * as H from "@effect/io/Hub"
import * as S from "@effect/stream/Stream"

describe("PlayHub", () => {
  it("should consume messages from a topic", async () => {
    const res = await T.runPromise(
      T.gen(function* ($) {
        const hub = yield* $(H.unbounded<string>())

        const stream = pipe(
          S.fromHub(hub),
          S.take(1),
          S.mapEffect((s) => T.log(`ooo: ${s}`))
        )

        const f1 = yield* $(pipe(S.runCollect(stream), T.fork))
        yield* $(T.delay(D.millis(10))(hub.publish("hello")))

        return yield* $(F.join(f1))
      })
    )

    expect(C.size(res)).toEqual(1)
  })
})
