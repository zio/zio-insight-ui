import * as Chunk from "@effect/data/Chunk"
import * as Context from "@effect/data/Context"
import * as Duration from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as HashMap from "@effect/data/HashMap"
import * as HashSet from "@effect/data/HashSet"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Hub from "@effect/io/Hub"
import * as Layer from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"
import * as Schedule from "@effect/io/Schedule"
import * as Stream from "@effect/stream/Stream"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import type { MetricState } from "@core/metrics/model/zio/metrics/MetricState"
import * as IdGenerator from "@core/services/IdGenerator"
import * as Utils from "@core/utils"

import * as InsightService from "./InsightService"

// The MetricsManager is a service where interested components can add InsightKeys
// to register their interest in those keys. Internally the MetricsManager will poll
// the ZIO application on a regular basis to obtain the state of all registered keys.
// Components can obtain a stream of MetricState updates, and for now all components
// will see all updates in the stream -   even the updates for keys they haven´t expressed
// interest in. As a result they have to filter for the events of interest themselves.
// Components can deregister their interest in particular keys and if no more components
// are interested in a particular key, the MetricsManager will stop polling for the
// corresponding metric state.

export interface MetricsManager {
  // Allow components to register their interest in particular keys
  readonly createSubscription: (
    keys: HashSet.HashSet<InsightKey>
  ) => Effect.Effect<never, never, string>
  // Allow components to completely remove their subscription
  readonly removeSubscription: (id: string) => Effect.Effect<never, never, void>
  // Modify a given subscription
  readonly modifySubscription: (
    id: string,
    f: (_: HashSet.HashSet<InsightKey>) => HashSet.HashSet<InsightKey>
  ) => Effect.Effect<never, never, void>
  // Get the union over all registered keys
  readonly registeredKeys: () => Effect.Effect<
    never,
    never,
    HashSet.HashSet<InsightKey>
  >
  // create a stream for incoming Metric State updates
  readonly updates: () => Effect.Effect<
    never,
    never,
    Stream.Stream<never, never, MetricState>
  >
  // Manually trigger a poll, the poll will cause an update to all connected
  // subscribers for metric data
  readonly poll: () => Effect.Effect<never, never, number>
  // Reset all subscriptions within the MetricsManager
  readonly reset: () => Effect.Effect<never, never, void>
}

export const MetricsManager = Context.Tag<MetricsManager>()

function makeMetricsManager(
  idSvc: IdGenerator.IdGenerator,
  insight: InsightService.InsightService,
  metricsHub: Hub.Hub<MetricState>,
  subscriptions: Ref.Ref<HashMap.HashMap<string, HashSet.HashSet<InsightKey>>>
) {
  // create a new subscription for a collection of InsightKeys, the new subscription will have a unique id
  // that can be used to unsubscribe again
  const createSubscription = (keys: HashSet.HashSet<InsightKey>) =>
    pipe(
      idSvc.nextId("mm"),
      Effect.flatMap((id) =>
        pipe(
          Effect.logDebug(
            `Adding subscription <${id}> with <${HashSet.size(
              keys
            )}> keys to MetricsManager`
          ),
          Effect.flatMap((_) => Ref.update(subscriptions, HashMap.set(id, keys))),
          Effect.map((_) => id)
        )
      )
    )

  // remove the subscription with the given subscription id
  const removeSubscription = (id: string) =>
    pipe(
      Effect.logDebug(`Removing subscription <${id}> from MetricsManager`),
      Effect.flatMap((_) => Ref.update(subscriptions, HashMap.remove(id)))
    )

  const modifySubscription = (
    id: string,
    f: (_: HashSet.HashSet<InsightKey>) => HashSet.HashSet<InsightKey>
  ) =>
    Effect.gen(function* ($) {
      yield* $(Effect.logDebug(`Modifying subscription <${id}> in MetricsManager`))
      const subs = yield* $(Ref.get(subscriptions))
      const oldKeys = Option.getOrElse(HashMap.get(id)(subs), HashSet.empty<InsightKey>)
      const newKeys = f(oldKeys)
      yield $(
        Effect.logDebug(`Subscription <${id}> has now <${HashSet.size(newKeys)}> keys`)
      )
      yield* $(Ref.set(subscriptions, HashMap.set(subs, id, newKeys)))
    })

  const registeredKeys = () =>
    Effect.gen(function* ($) {
      const subs = yield* $(Ref.get(subscriptions))
      const keys = HashMap.reduce(subs, HashSet.empty<InsightKey>(), (z, v) =>
        HashSet.union(z, v)
      )
      yield $(
        pipe(
          Effect.logDebug(
            `Found <${HashSet.size(keys)}> metric keys over all registrations`
          ),
          Effect.when(() => HashSet.size(keys) > 0)
        )
      )
      return keys
    })

  const updates = () =>
    Effect.gen(function* ($) {
      const stream = Stream.fromHub(metricsHub)
      yield* $(Effect.logDebug(`Created stream for metric updates`))
      return stream
    })

  const reset = () =>
    Ref.set(subscriptions, HashMap.empty<string, HashSet.HashSet<InsightKey>>())

  const getStates = (keys: readonly string[]) =>
    pipe(
      insight.getMetricStates(keys),
      Effect.catchAll((err) =>
        pipe(
          Effect.logWarning(
            `Error getting metric states from server: <${JSON.stringify(err)}>`
          ),
          Effect.flatMap((_) => Effect.succeed(Chunk.empty<MetricState>()))
        )
      ),
      Effect.tap((res) =>
        Effect.logDebug(`Got <${res.length}> metric states from Application`)
      )
    )

  const pollMetrics = () =>
    Effect.gen(function* ($) {
      const keys = yield* $(
        pipe(registeredKeys(), Effect.map(HashSet.map((k) => k.id)))
      )

      if (HashSet.size(keys) > 0) {
        yield* $(
          Effect.logDebug(
            `MM: Found <${HashSet.size(keys)}> registered keys over all subscriptions`
          )
        )

        const keyArr = [...keys]
        yield* $(Effect.logInfo(`polling metrics for <${keyArr.length}> keys`))
        const states = yield* $(getStates(keyArr))
        const published = yield* $(metricsHub.publishAll(states))
        yield* $(
          Effect.logDebug(
            `published <${states.length}> metric states to metrics hub : ${published}`
          )
        )
        return states.length
      } else {
        return 0
      }
    })

  return {
    createSubscription,
    removeSubscription,
    modifySubscription,
    registeredKeys,
    updates,
    reset,
    poll: pollMetrics,
  } as MetricsManager
}

export const live = Layer.effect(
  MetricsManager,
  Effect.gen(function* ($) {
    // TODO: Review the Hub configuration
    const hub = yield* $(Hub.unbounded<MetricState>())
    const insight = yield* $(InsightService.InsightService)
    const idSvc = yield* $(IdGenerator.IdGenerator)
    const subscriptions = yield* $(
      Ref.make(HashMap.empty<string, HashSet.HashSet<InsightKey>>())
    )

    const mm = makeMetricsManager(idSvc, insight, hub, subscriptions)

    // TODO: Make the polling interval configurable
    yield* $(
      Utils.withDefaultScheduler(
        Effect.forkDaemon(
          Effect.repeat(Schedule.spaced(Duration.millis(3000)))(mm.poll())
        )
      )
    )

    yield* $(Effect.logDebug(`Started MetricsManager`))
    return mm
  })
)
