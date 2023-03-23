import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as IdSvc from "@core/services/IdGenerator"
import * as Log from "@core/services/Logger"

describe("IdSvc", () => {
  const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.All)).runtime

  it("should generate an id", async () => {
    const res = await RT.runPromiseExit(testRt)(IdSvc.nextId("app"))

    expect(res._tag).toEqual("Success")
  })
})
