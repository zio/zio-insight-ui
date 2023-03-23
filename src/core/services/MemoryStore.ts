import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as T from "@effect/io/Effect"
import * as Ref from "@effect/io/Ref"

// A Memory Store provides a convenient to create a HashMap<K,V>
// as a Layer within the application.

export interface KeyDoesNotExist<K> {
  readonly _tag: "KeyDoesNotExist"
  readonly key: K
}

export interface KeyAlreadyExists<K> {
  readonly _tag: "KeyAlreadyExists"
  readonly key: K
}

export interface MemoryStore<K, V> {
  // Return the item for the given key from the underlying store or return an error
  // if the key does not exist
  get: (k: K) => T.Effect<never, KeyDoesNotExist<K>, V>
  // Effectfully create an item and place it in the underlying store, potentially replacing
  // the existing item in the store
  set: <E>(k: K, v: T.Effect<never, E, V>) => T.Effect<never, E, V>
  // Remove an element from the store
  remove: (
    k: K,
    cleanUp: (v: V) => T.Effect<never, never, void>
  ) => T.Effect<never, never, void>

  update: (
    f: (_: HMap.HashMap<K, V>) => HMap.HashMap<K, V>
  ) => T.Effect<never, never, HMap.HashMap<K, V>>
  getAll: T.Effect<never, never, HMap.HashMap<K, V>>
}

function makeMemoryStore<K, V>(
  sem: T.Semaphore,
  elements: Ref.Ref<HMap.HashMap<K, V>>
) {
  const itemByKey = (k: K) => pipe(Ref.get(elements), T.map(HMap.get(k)))

  const get = (k: K) =>
    sem.withPermits(1)(
      T.gen(function* ($) {
        const mbSvc = yield* $(itemByKey(k))
        switch (mbSvc._tag) {
          case "None":
            return yield* $(T.fail({ key: k } as KeyDoesNotExist<K>))
          case "Some":
            return mbSvc.value
        }
      })
    )

  const set = <E>(k: K, v: T.Effect<never, E, V>) =>
    sem.withPermits(1)(
      T.gen(function* ($) {
        const elem = yield* $(v)
        yield* $(Ref.update(elements, HMap.set(k, elem)))
        return elem
      })
    )

  const remove = (k: K, cleanUp: (v: V) => T.Effect<never, never, void>) =>
    sem.withPermits(1)(
      T.gen(function* ($) {
        const elem = yield* $(itemByKey(k))
        yield* $(Ref.update(elements, HMap.remove(k)))
        switch (elem._tag) {
          case "None":
            break
          case "Some":
            yield* $(cleanUp(elem.value))
            break
        }
        return
      })
    )

  const update = (f: (_: HMap.HashMap<K, V>) => HMap.HashMap<K, V>) =>
    sem.withPermits(1)(
      T.gen(function* ($) {
        return yield* $(Ref.updateAndGet(elements, f))
      })
    )

  return {
    get,
    set,
    remove,
    update,
    getAll: Ref.get(elements),
  } as MemoryStore<K, V>
}

export function createMemoryStore<K, V>() {
  return T.gen(function* ($) {
    const sem = yield* $(T.makeSemaphore(1))
    const elems = yield* $(Ref.make(HMap.empty() as HMap.HashMap<K, V>))

    return makeMemoryStore<K, V>(sem, elems)
  })
}
