import * as T from '@effect/core/io/Effect'
import * as L from '@effect/core/io/Layer'
import * as Log from '@core/logger'
import * as Api from '@core/api'
import { pipe } from '@tsplus/stdlib/data/Function'

// Pipe a console logger instance into the ZIO Metrics Live instance 
// This gives us an overall Layer<never, never, ZIOMetrics>
// Note that the console is not actually available in the constructed environment 
// This could be achieved with "merge" rather then "provideTo"
const layer = pipe(
  Log.consoleLogger,
  L.provideTo(Api.ZIOLive)
)

describe("Request", () => {
  it("should simply get something", async () => {

    const res = await T.unsafeRunPromise(
      pipe(
        Api.getMetricKeys,
        T.provideSomeLayer(layer)
      )
    )
    
    expect(res.length).toBeGreaterThan(0)
  })
})
