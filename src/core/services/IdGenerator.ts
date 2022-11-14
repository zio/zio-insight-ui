import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as Ref from "@effect/core/io/Ref"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as C from "@effect/core/io/Clock"
import * as Log from "@core/services/Logger"
import * as Sem from "@effect/core/stm/TSemaphore"

/**
 * A simple ID generator to generate unique strings within the application, 
 * can be used to generated distinguished keys for anything that needs to be 
 * distinguished. 
 */
export interface IdGenerator { 
  readonly nextId : (_ : string) => T.Effect<never, never, string>
}

export const IdGenerator = Tag<IdGenerator>()

function make(
  log: Log.LogService,
  sem: Sem.TSemaphore,
  lastTS : Ref.Ref<number>,
  cnt: Ref.Ref<number>
) {

  // make sure the key generator runs atomically 
  const update = (prefix: string) => 
    Sem.withPermit(sem)(
      pipe(
        T.Do(),
        T.bind("now", () => C.currentTime),
        T.bind("curr", ({now}) => lastTS.updateAndGet(_ => now)),
        T.bind("cnt", ({curr, now}) => { 
          if ( curr === now ) return cnt.updateAndGet(c => c +1)
          else return cnt.updateAndGet(_ => 1)
        }),
        T.map(({curr, cnt}) => `${prefix}-${curr}-${cnt}`),
        T.tap(s => log.debug(`Generated Id : ${s}`))
      )
    )

  return (
    T.sync(() => <IdGenerator>{ 
      nextId : (prefix: string) => update(prefix)
    })
  )
}

export const live = L.fromEffect(IdGenerator)(
  pipe(
    T.Do(),
    T.bind("log", () => T.service(Log.LogService)),
    T.bind("sem", () => Sem.make(1)),
    T.bind("ts", () => Ref.makeRef(() => 0)),
    T.bind("cnt", () => Ref.makeRef(() => 0)),
    T.flatMap(({log, sem, ts, cnt}) =>make(log, sem, ts, cnt))
  )
)

export const nextId = (prefix: string) =>
  T.serviceWithEffect(IdGenerator, svc => svc.nextId(prefix))