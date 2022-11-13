import * as S from "@effect/core/stream/Stream"
import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as Hub from "@effect/core/io/Hub"
import * as Ref from "@effect/core/io/Ref"
import { pipe } from "@tsplus/stdlib/data/Function"
import { Tag } from "@tsplus/stdlib/service/Tag"

/**
 * Just a dummy service doing some work and publish some data 
 * to one or more subscribers, Something like this will be used 
 * to poll the metric data from the server and push the metric 
 * state downstream into the UI.
 */
interface Foo {
  count: () => T.Effect<never, never, void>
  stream: () => T.Effect<never, never, S.Stream<never, never, number>>
}

const Foo = Tag<Foo>()

function makeFoo() : T.Effect<never, never, Foo> {
  return pipe(
    Hub.unbounded<number>(),
    T.zip(Ref.makeRef<number>( () => 0)),
    T.map( ([hub, ref]) => <Foo>{
      count: () => pipe(
        ref.getAndUpdate(n => n + 1),
        T.flatMap(n => hub.offer(n))
      ),
      stream: () => T.sync(() => S.fromHub(hub))
    })
  )
}

const FooLayer = L.fromEffect<Foo>(Foo)(makeFoo())

const run = (svc: Foo) => 
  pipe(
    svc.stream(),
    T.flatMap(s => 
      pipe(
        S.take(11)(s),
        S.runForEach( (n: number) => T.succeed(console.log(`got ${n}`)))
      )
    )
  )

describe("Simple", () => {

  it("should produce values", async () => {

    // create a Foo Service encapsulating a Hub and create 2 consumers 
    const res = await T.unsafeRunPromiseExit(
      pipe(
        T.service<Foo>(Foo),
        T.flatMap(foo => 
          pipe(
            T.forkDaemon(run(foo)),
            T.flatMap(_ => T.forkDaemon(run(foo))),
            T.flatMap(_ => pipe(
              foo.count(),
              T.repeatN(10)
            ))
          )
        ),
        T.provideSomeLayer(FooLayer)
      )
    )

    expect(res._tag).toEqual("Success")
  })
})