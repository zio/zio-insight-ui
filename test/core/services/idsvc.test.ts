import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as IdSvc from "@core/services/IdGenerator"

describe("IdSvc", () => {
  const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

  it("should generate an id", async () => {
    const res = await RT.runPromiseExit(testRt)(IdSvc.nextId("app"))
    expect(res._tag).toEqual("Success")
  })
})
