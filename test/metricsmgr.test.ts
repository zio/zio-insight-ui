import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as MM from "@core/metrics/service/MetricsManager"
import * as C from "@tsplus/stdlib/collections/Chunk"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as AL from "@core/AppLayer"
import * as Log from "@core/services/Logger"
import * as Model from "@core/metrics/model/MetricKey"
import * as IdSvc from "@core/services/IdGenerator"

const testRt = pipe(
  Log.LoggerLive,
  L.provideToAndMerge(IdSvc.live),
  L.provideToAndMerge(MM.live),
  AL.unsafeMakeRuntime
).runtime

describe("MetricsManager", () => {

  it("should start empty", async () => {

    const res = await testRt.unsafeRunPromise(
      pipe(
        T.service(MM.MetricsManager),
        T.flatMap(mm => mm.registeredKeys()),
        T.map(C.isEmpty)
      )      
    )

    expect(res).toBe(true)
  })

  it("should allow to register keys", async () => {

    const newKeys = C.make(<Model.InsightKey>{
      id: "1234-5678",
      key: <Model.MetricKey>{
        name: "foo",
        labels: [],
        metricType: "Counter"      
      }
    })

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const idSvc = yield* $(T.service(IdSvc.IdGenerator))
        const mm = yield* $(T.service(MM.MetricsManager))
        yield* $(
          pipe(
            idSvc.nextId("test"),
            T.flatMap(id => mm.setSubscription(id, newKeys))
          )
        )
        return yield* $(pipe(mm.registeredKeys(), T.map(C.size)))      
      })
    )

    expect(res).toBeGreaterThan(0)
  })
})