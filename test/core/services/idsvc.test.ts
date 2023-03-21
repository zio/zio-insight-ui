import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as IdSvc from "@core/services/IdGenerator"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as Log from "@core/services/Logger"

describe("IdSvc", () => {

  const layer = pipe(
    Log.ConsoleLive,
    L.provideToAndMerge(Log.live(Log.Off)),
    L.provideTo(IdSvc.live)
  )

  it("should generate an id", async () => {

    const res = await T.unsafeRunPromiseExit(
      pipe(
        IdSvc.nextId("app"),
        T.provideLayer(layer)
      )
    )

    expect(res._tag).toEqual("Success")
  })

})