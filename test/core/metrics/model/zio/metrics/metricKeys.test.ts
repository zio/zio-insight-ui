import * as T from "@effect/core/io/Effect"

import * as AL from "@core/AppLayer"
import * as Insight from "@core/metrics/services/InsightService"
import * as Log from "@core/services/Logger"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.Off)).runtime

describe("MetricKeys Parser", () => {
  it("should parse the metric keys from the server", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const svc = yield* $(T.service(Insight.InsightService))
        return yield* $(svc.getMetricKeys)
      })
    )

    expect(res.length).toBeGreaterThan(0)
  })
})
