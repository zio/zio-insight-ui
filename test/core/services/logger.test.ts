import * as Ex from "@effect/io/Exit"
import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as Log from "@core/services/Logger"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic(Log.All)).runtime

describe("Logger", () => {
  it("should simply log something", async () => {
    const res = await RT.runPromiseExit(testRt)(Log.info("Hello Andreas!"))

    expect(Ex.isSuccess(res)).toBeTruthy
  })
})
