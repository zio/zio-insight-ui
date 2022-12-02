import * as T from "@effect/core/io/Effect"
import * as Ref from "@effect/core/io/Ref"
import * as Log from "@core/services/Logger"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Sem from "@effect/core/stm/TSemaphore"
import { pipe } from "@tsplus/stdlib/data/Function"
import { E } from "vitest/dist/global-732f9b14"

// A Memory Store provides a convenient to create a HashMap<K,V>
// as a Layer within the application. 

export class KeyDoesExist<K>{
  readonly key: K

  constructor(k:K) { 
    this.key = k
  }
}

export interface MemoryStore<K, V>{
  get: (k: K) => T.Effect<never, KeyDoesExist<K>, V>
  set: (k: K, v: T.Effect<never, E, V>) => T.Effect<never, E, V>
  remove: (k: K, cleanUp: (v:V) => T.Effect<never, never, void>) => T.Effect<never, never, void>
}

export function makeMemoryStore<K,V>(
  sem: Sem.TSemaphore,
  log: Log.LogService,
  elements: Ref.Ref<HMap.HashMap<K, V>>
) {

  const itemByKey = (k: K) => pipe(
    elements.get,
    T.map(HMap.get(k))
  )

  const get = (k: K) =>
    Sem.withPermit(sem)(
      T.gen(function* ($) {

        const mbSvc = yield* $(itemByKey(k))
        switch(mbSvc._tag) { 
          case "None":
            return yield* $(T.fail(<KeyDoesExist<K>>{key: k}))
          case "Some":
            return mbSvc.value
        }
      })
    )

  const set = (k: K, v: T.Effect<never, E, V>) => 
    Sem.withPermit(sem)(
      T.gen(function* ($) {
        const elem = yield* $(v)
        yield* $(elements.update(HMap.set(k, elem)))
        return elem
      })
    )

  const remove = (k: K, cleanUp : (v:V) => T.Effect<never, never, void>) => 
    Sem.withPermit(sem)(
      T.gen(function* ($){
        const elem = yield* $(itemByKey(k))
        yield* $(elements.update(HMap.remove(k)))
        switch(elem._tag) { 
          case "None":
            break
          case "Some":
            yield* $(cleanUp(elem.value))
            break
        }
        return
      })
    )

  return T.sync(() => <MemoryStore<K,V>>{
    get: get,
    set: set,
    remove: remove
  })
}
