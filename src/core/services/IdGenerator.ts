import * as C from "@effect/core/io/Clock"
import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as Ref from "@effect/core/io/Ref"
import * as Sem from "@effect/core/stm/TSemaphore"
import { Tag } from "@tsplus/stdlib/service/Tag"

import * as Log from "@core/services/Logger"

/**
 * A simple ID generator to generate unique strings within the application,
 * can be used to generated distinguished keys for anything that needs to be
 * distinguished.
 */
export interface IdGenerator {
  readonly nextId: (_: string) => T.Effect<never, never, string>
}

export const IdGenerator = Tag<IdGenerator>()

function make(
  log: Log.LogService,
  sem: Sem.TSemaphore,
  lastTS: Ref.Ref<number>,
  cnt: Ref.Ref<number>
) {
  // make sure the key generator runs atomically
  const update = (prefix: string) =>
    Sem.withPermit(sem)(
      T.gen(function* ($) {
        const now = yield* $(C.currentTime)
        const curr = yield* $(lastTS.getAndSet(now))
        if (curr == now) {
          yield* $(cnt.update((c) => c + 1))
        } else {
          yield* $(cnt.set(1))
        }
        const next = yield* $(cnt.get)
        const res = `${prefix}-${now}-${next}`
        yield* $(log.debug(`Generated Id: <${res}>`))
        return res
      })
    )

  return T.sync(() => {
    return {
      nextId: (prefix: string) => update(prefix),
    } as IdGenerator
  })
}

export const live = L.fromEffect(IdGenerator)(
  T.gen(function* ($) {
    const now = yield* $(C.currentTime)
    const log = yield* $(T.service(Log.LogService))
    const sem = yield* $(Sem.make(1))
    const ts = yield* $(Ref.makeRef(() => now))
    const cnt = yield* $(Ref.makeRef(() => 0))
    return yield* $(make(log, sem, ts, cnt))
  })
)

export const nextId = (prefix: string) =>
  T.serviceWithEffect(IdGenerator, (svc) => svc.nextId(prefix))
