import * as Context from "@effect/data/Context"
import * as Duration from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as HashSet from "@effect/data/HashSet"
import * as Effect from "@effect/io/Effect"
import * as Hub from "@effect/io/Hub"
import * as Layer from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"
import * as Schedule from "@effect/io/Schedule"
import * as Stream from "@effect/stream/Stream"
import * as IdGen from "@services/idgenerator/IdGenerator"

import type * as F from "@core/metrics/model/insight/fibers/FiberInfo"
import * as Utils from "@core/utils"

import * as Insight from "./InsightService"

export interface FiberDataService {
  // Subscribe to regular updates of fiber infos coming from the connected ZIO application
  // The fiber returns the subscription id and a stream of fiber info updates
  readonly createSubscription: () => Effect.Effect<
    never,
    never,
    [string, Stream.Stream<never, never, F.FiberInfo[]>]
  >

  // Remove a subscription
  readonly removeSubscription: (id: string) => Effect.Effect<never, never, void>

  readonly subscriptionIds: () => Effect.Effect<never, never, HashSet.HashSet<string>>

  readonly poll: () => Effect.Effect<never, never, void>
}

export const FiberDataService = Context.Tag<FiberDataService>()

export const live = Layer.effect(
  FiberDataService,
  Effect.gen(function* ($) {
    function makeFiberDataService(
      idSvc: IdGen.IdGenerator,
      fiberInfoHub: Hub.Hub<F.FiberInfo[]>,
      subscriptions: Ref.Ref<HashSet.HashSet<string>>,
      insight: Insight.InsightService
    ): FiberDataService {
      const subscribe = () =>
        Effect.gen(function* ($) {
          const id = yield* $(idSvc.nextId("fds"))
          const stream = Stream.fromHub(fiberInfoHub)
          yield* $(Ref.update(subscriptions, (s) => HashSet.add(s, id)))
          return [id, stream] as [string, Stream.Stream<never, never, F.FiberInfo[]>]
        })

      const unsubscribe = (id: string) =>
        Ref.update(subscriptions, (s) => HashSet.remove(s, id))

      const subscriptionIds = () =>
        pipe(Ref.get(subscriptions), Effect.map(HashSet.fromIterable))

      const pollFiberData = () =>
        Effect.gen(function* ($) {
          const cntSubscriptions = yield* $(
            pipe(Ref.get(subscriptions), Effect.map(HashSet.size))
          )

          if (cntSubscriptions > 0) {
            yield* $(
              Effect.log(`Fetching Fiber data for ${cntSubscriptions} subscribers`)
            )
            const fiberData = yield* $(
              pipe(
                insight.getFibers,
                Effect.catchAll((_) => Effect.succeed([] as F.FiberInfo[]))
              )
            )
            yield* $(Effect.logDebug(`Found: ${fiberData.length} fibers`))
            yield* $(
              pipe(
                Hub.publish(hub, fiberData),
                Effect.when(() => fiberData.length > 0)
              )
            )
          }
        })

      return {
        createSubscription: subscribe,
        removeSubscription: unsubscribe,
        subscriptionIds,
        poll: pollFiberData,
      } as FiberDataService
    }

    const hub = yield* $(Hub.sliding<F.FiberInfo[]>(128))
    const insight = yield* $(Insight.InsightService)
    const idSvc = yield* $(IdGen.IdGenerator)
    const subscriptions = yield* $(Ref.make(HashSet.empty<string>()))

    // TODO: Make this configurable

    const svc = makeFiberDataService(idSvc, hub, subscriptions, insight)

    yield* $(
      Utils.withDefaultScheduler(
        Effect.forkDaemon(
          Effect.repeat(Schedule.spaced(Duration.millis(3000)))(svc.poll())
        )
      )
    )

    return svc
  })
)
