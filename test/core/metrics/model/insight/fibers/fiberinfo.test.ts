import * as AL from "@core/AppLayer"
import * as Insight from "@core/metrics/services/InsightService"
import * as Log from "@core/services/Logger"
import * as T from "@effect/core/io/Effect"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.Off)).runtime

describe("FiberInfos Parser", () => {
  it("should parse the fiber infos from the server", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const svc = yield* $(T.service(Insight.InsightService))
        return yield* $(svc.getFibers)
      })
    )

    expect(res.length).toBeGreaterThan(0)
  })
})
