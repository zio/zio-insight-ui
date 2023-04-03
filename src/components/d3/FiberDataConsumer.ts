import * as Effect from "@effect/io/Effect"
import type * as Fiber from "@effect/io/Fiber"
import * as Runtime from "@effect/io/Runtime"
import * as Stream from "@effect/stream/Stream"

import type * as AppLayer from "@core/AppLayer"
import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberDataService from "@core/metrics/services/FiberDataService"

interface FiberUpdater {
  fds: FiberDataService.FiberDataService
  id: string
  updater: Fiber.Fiber<unknown, void>
}

export const createFiberUpdater = (
  appRt: Runtime.Runtime<AppLayer.AppLayer>,
  onData: (fibers: FiberInfo.FiberInfo[]) => void
) => {
  const updater = Effect.gen(function* ($) {
    const fds = yield* $(FiberDataService.FiberDataService)
    const [id, updates] = yield* $(fds.createSubscription())

    const updater = yield* $(
      Effect.forkDaemon(
        Stream.runForEach(updates, (infos) => {
          return Effect.try(() => {
            onData(infos)
          })
        })
      )
    )

    return {
      fds,
      id,
      updater,
    } as FiberUpdater
  })

  const runner = Runtime.runSync(appRt)(updater)

  Runtime.runPromise(appRt)(runner.fds.removeSubscription(runner.id)).then((_) => {
    // do nothing
  })
}
