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

import type * as FiberInfo from "@core/metrics/model/insight/fibers/FiberInfo"
import * as FiberTraceRequest from "@core/metrics/model/insight/fibers/FiberTraceRequest"
import * as Utils from "@core/utils"

import * as Insight from "./InsightService"

export interface FiberDataService {
  readonly traceRequest: Effect.Effect<
    never,
    never,
    FiberTraceRequest.FiberTraceRequest
  >
  readonly setTraceRequest: (
    req: FiberTraceRequest.FiberTraceRequest
  ) => Effect.Effect<never, never, void>

  // Subscribe to regular updates of fiber infos coming from the connected ZIO application
  // The fiber returns the subscription id and a stream of fiber info updates
  readonly createSubscription: () => Effect.Effect<
    never,
    never,
    [string, Stream.Stream<never, never, FiberInfo.FiberInfo[]>]
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
      fiberInfoHub: Hub.Hub<FiberInfo.FiberInfo[]>,
      subscriptions: Ref.Ref<HashSet.HashSet<string>>,
      insight: Insight.InsightService,
      traceRequest: Ref.Ref<FiberTraceRequest.FiberTraceRequest>
    ): FiberDataService {
      const unsubscribe = (id: string) =>
        Effect.zipRight(
          Effect.logDebug(`Removed fiber data subscription ${id}`),
          Ref.update(subscriptions, (s) => HashSet.remove(s, id))
        )

      const subscriptionIds = () =>
        pipe(Ref.get(subscriptions), Effect.map(HashSet.fromIterable))

      const hasSubscription = (id: string) => {
        return pipe(
          Ref.get(subscriptions),
          Effect.map((ids) => HashSet.has(ids, id))
        )
      }

      const subscribe = () =>
        Effect.gen(function* ($) {
          const id = yield* $(idSvc.nextId("fds"))
          yield* $(Ref.update(subscriptions, (s) => HashSet.add(s, id)))
          const stream = Stream.takeUntilEffect((_) =>
            pipe(
              hasSubscription(id),
              Effect.map((r) => !r)
            )
          )(Stream.fromHub(fiberInfoHub))
          yield* $(Effect.logDebug(`Created fiber data subscription ${id}`))
          return [
            id,
            stream,
          ] as [string, Stream.Stream<never, never, FiberInfo.FiberInfo[]>]
        })

      const pollFiberData = () =>
        Effect.gen(function* ($) {
          const cntSubscriptions = yield* $(
            pipe(Ref.get(subscriptions), Effect.map(HashSet.size))
          )

          if (cntSubscriptions > 0) {
            const req = yield* $(Ref.get(traceRequest))
            yield* $(
              Effect.log(
                `Fetching Fiber data for ${cntSubscriptions} subscribers with ${JSON.stringify(
                  req
                )}}`
              )
            )
            const fiberData = yield* $(
              pipe(
                insight.getFibers(req),
                Effect.catchAll((_) => Effect.succeed([] as FiberInfo.FiberInfo[]))
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

      const setTraceRequest = (req: FiberTraceRequest.FiberTraceRequest) =>
        Effect.zipRight(
          Effect.logDebug(`Set trace request to ${JSON.stringify(req)}`),
          Ref.set(traceRequest, req)
        )

      return {
        traceRequest: Ref.get(traceRequest),
        setTraceRequest,
        createSubscription: subscribe,
        removeSubscription: unsubscribe,
        subscriptionIds,
        poll: pollFiberData,
      } as FiberDataService
    }

    const hub = yield* $(Hub.sliding<FiberInfo.FiberInfo[]>(128))
    const insight = yield* $(Insight.InsightService)
    const idSvc = yield* $(IdGen.IdGenerator)
    const subscriptions = yield* $(Ref.make(HashSet.empty<string>()))
    const initialTraceRequest = yield* $(
      Ref.make(FiberTraceRequest.defaultTraceRequest)
    )

    // TODO: Make this configurable

    const svc = makeFiberDataService(
      idSvc,
      hub,
      subscriptions,
      insight,
      initialTraceRequest
    )

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
