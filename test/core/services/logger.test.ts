import * as Log from "@core/services/Logger"
import * as Ex from "@effect/core/io/Exit"
import * as AL from "@core/AppLayer"
import { pipe } from "@tsplus/stdlib/data/Function"

const testRt = AL.unsafeMakeRuntime(
  AL.appLayerStatic
).runtime

describe("Logger", () => { 

  it("should simply log something", async () => {

    const res = await testRt.unsafeRunPromiseExit(
      pipe(
        Log.info("Hello Andreas!")
      )     
    )

    expect(Ex.isSuccess(res)).toBeTruthy
  })
})