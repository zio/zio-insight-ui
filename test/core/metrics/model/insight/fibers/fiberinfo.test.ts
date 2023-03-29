import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as Insight from "@core/metrics/services/InsightService"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

describe("FiberInfos Parser", () => {
  it("should parse the fiber infos from the server", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const svc = yield* $(T.service(Insight.InsightService))
        return yield* $(svc.getFibers)
      })
    )

    expect(res.length).toBeGreaterThan(0)
  })
})
