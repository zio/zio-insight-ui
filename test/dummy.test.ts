import * as T from "@effect/core/io/Effect"
import * as Ref from "@effect/core/io/Ref"
import * as L from "@effect/core/io/Layer"
import { Tag } from "@tsplus/stdlib/service/Tag" 
import { pipe } from "@tsplus/stdlib/data/Function"

// A really dumb counter service that most likely will never be used anywhere, 
// just to see how we can create a stateful service on top of a ref 
export interface CounterSvc {
  readonly increment : T.Effect<never, never, void>
  readonly decrement : T.Effect<never, never, void>
  readonly current: T.Effect<never, never, number>
}

const CounterSvcTag = Tag<CounterSvc>()

const makeCounter : (_: number) => T.Effect<never, never, CounterSvc> = (initial: number) => pipe(
  Ref.makeRef<number>(() => initial),
  T.map<Ref.Ref<number>, CounterSvc>( (r) => ({
    increment: pipe(
      r.get,
      T.flatMap(c => r.set(c + 1))
    ),
    decrement: pipe(
      r.get,
      T.flatMap(c => r.set(c - 1))
    ),
    current: r.get
  }))
)

export const liveCounter: L.Layer<never, never, CounterSvc> = 
  L.fromEffect<CounterSvc>(CounterSvcTag)(makeCounter(0))

export const increment = () => 
  T.serviceWithEffect(CounterSvcTag, c => c.increment)

export const decrement = () => 
  T.serviceWithEffect(CounterSvcTag, c => c.decrement)

export const current = () =>
  T.serviceWithEffect(CounterSvcTag, c => c.current)

describe("CounterSvc", () => {

  it("should start with 0", async () => {
    const res = await T.unsafeRunPromise(
      pipe(
        current(),
        T.provideSomeLayer(liveCounter)
      )
    )

    expect(res).toEqual(0)
  })

  it("should increment", async () => {
    const res = await T.unsafeRunPromise(
      pipe(
        increment(),
        T.flatMap(_ => current()),
        T.provideSomeLayer(liveCounter)
      )
    )

    expect(res).toEqual(1)
  })

  it("should decrement", async () => {
    const res = await T.unsafeRunPromise(
      pipe(
        decrement(),
        T.flatMap(_ => current()),
        T.provideSomeLayer(liveCounter)
      )
    )

    expect(res).toEqual(-1)
  })
})