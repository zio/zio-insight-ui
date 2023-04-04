import * as RT from "@effect/io/Runtime"
import * as Services from "@services/Services"

import * as AL from "@core/AppLayer"

describe("IdSvc", () => {
  const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

  it("should generate an id", async () => {
    const res = await RT.runPromiseExit(testRt)(Services.IdGenerator.nextId("app"))
    expect(res._tag).toEqual("Success")
  })
})
