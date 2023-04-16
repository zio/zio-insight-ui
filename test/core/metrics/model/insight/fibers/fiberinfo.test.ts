import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as FiberTraceRequest from "@core/metrics/model/insight/fibers/FiberTraceRequest"
import * as Insight from "@core/metrics/services/InsightService"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

describe("FiberInfos Parser", () => {
  it("should parse the fiber infos from the server", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const svc = yield* $(Insight.InsightService)
        return yield* $(svc.getFibers(FiberTraceRequest.defaultTraceRequest))
      })
    )

    expect(res.length).toBeGreaterThan(0)
  })
})
