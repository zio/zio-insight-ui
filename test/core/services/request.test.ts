import * as HS from "@effect/data/HashSet"
import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as Api from "@core/metrics/services/InsightService"
import * as Log from "@core/services/Logger"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.All)).runtime

describe("Request", () => {
  it("should be able to get the metric keys", async () => {
    const res = await RT.runPromise(testRt)(Api.getMetricKeys)
    expect(HS.size(res)).toBeGreaterThan(0)
  })

  it("should be able to get the states for a given set of keys", async () => {
    const res = await RT.runPromise(testRt)(
      Api.getMetricStates(["14f12b03-adfd-305d-ba50-631fbdfdeb62"] as string[])
    )

    expect(res.length).toEqual(1)
  })
})
