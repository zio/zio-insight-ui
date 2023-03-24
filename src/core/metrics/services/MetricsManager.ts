import * as C from "@effect/data/Chunk"
import * as Ctx from "@effect/data/Context"
import * as D from "@effect/data/Duration"
import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as HS from "@effect/data/HashSet"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as FiberRef from "@effect/io/FiberRef"
import * as Hub from "@effect/io/Hub"
import * as L from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"
import * as Sch from "@effect/io/Schedule"
import * as Scheduler from "@effect/io/Scheduler"
import * as S from "@effect/stream/Stream"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import type { MetricState } from "@core/metrics/model/zio/metrics/MetricState"
import * as IdSvc from "@core/services/IdGenerator"

import * as Insight from "./InsightService"

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
    keys: HS.HashSet<InsightKey>
  ) => T.Effect<never, never, string>
  // Allow components to completely remove their subscription
  readonly removeSubscription: (id: string) => T.Effect<never, never, void>
  // Modify a given subscription
  readonly modifySubscription: (
    id: string,
    f: (_: HS.HashSet<InsightKey>) => HS.HashSet<InsightKey>
  ) => T.Effect<never, never, void>
  // Get the union over all registered keys
  readonly registeredKeys: () => T.Effect<never, never, HS.HashSet<InsightKey>>
  // create a stream for incoming Metric State updates
  readonly updates: () => T.Effect<never, never, S.Stream<never, never, MetricState>>
  // Manually trigger a poll, the poll will cause an update to all connected
  // subscribers for metric data
  readonly poll: () => T.Effect<never, never, number>
  // Reset all subscriptions within the MetricsManager
  readonly reset: () => T.Effect<never, never, void>
}

export const MetricsManager = Ctx.Tag<MetricsManager>()

function makeMetricsManager(
  idSvc: IdSvc.IdGenerator,
  insight: Insight.InsightService,
  metricsHub: Hub.Hub<MetricState>,
  subscriptions: Ref.Ref<HMap.HashMap<string, HS.HashSet<InsightKey>>>
) {
  // create a new subscription for a collection of InsightKeys, the new subscription will have a unique id
  // that can be used to unsubscribe again
  const createSubscription = (keys: HS.HashSet<InsightKey>) =>
    pipe(
      idSvc.nextId("mm"),
      T.flatMap((id) =>
        pipe(
          T.logDebug(
            `Adding subscription <${id}> with <${HS.size(keys)}> keys to MetricsManager`
          ),
          T.flatMap((_) => Ref.update(subscriptions, HMap.set(id, keys))),
          T.map((_) => id)
        )
      )
    )

  // remove the subscription with the given subscription id
  const removeSubscription = (id: string) =>
    pipe(
      T.logDebug(`Removing subscription <${id}> from MetricsManager`),
      T.flatMap((_) => Ref.update(subscriptions, HMap.remove(id)))
    )

  const modifySubscription = (
    id: string,
    f: (_: HS.HashSet<InsightKey>) => HS.HashSet<InsightKey>
  ) =>
    T.gen(function* ($) {
      yield* $(T.logDebug(`Modifying subscription <${id}> in MetricsManager`))
      const subs = yield* $(Ref.get(subscriptions))
      const oldKeys = Opt.getOrElse(HMap.get(id)(subs), HS.empty<InsightKey>)
      const newKeys = f(oldKeys)
      yield $(T.logDebug(`Subscription <${id}> has now <${HS.size(newKeys)}> keys`))
      yield* $(Ref.set(subscriptions, HMap.set(subs, id, newKeys)))
    })

  const registeredKeys = () =>
    T.gen(function* ($) {
      const subs = yield* $(Ref.get(subscriptions))
      const keys = HMap.reduce(subs, HS.empty<InsightKey>(), (z, v) => HS.union(z, v))
      yield $(T.logDebug(`Found <${HS.size(keys)}> metric keys over all registrations`))
      return keys
    })

  const updates = () =>
    T.gen(function* ($) {
      const stream = S.fromHub(metricsHub)
      yield* $(T.logDebug(`Created stream for metric updates`))
      return stream
    })

  const reset = () =>
    Ref.set(subscriptions, HMap.empty<string, HS.HashSet<InsightKey>>())

  const getStates = (keys: readonly string[]) =>
    pipe(
      insight.getMetricStates(keys),
      T.catchAll((err) =>
        pipe(
          T.logWarning(
            `Error getting metric states from server: <${JSON.stringify(err)}>`
          ),
          T.flatMap((_) => T.succeed(C.empty<MetricState>()))
        )
      ),
      T.tap((res) => T.logDebug(`Got <${res.length}> metric states from Application`))
    )

  const pollMetrics = () =>
    T.gen(function* ($) {
      const keys = yield* $(pipe(registeredKeys(), T.map(HS.map((k) => k.id))))

      yield* $(
        T.logDebug(
          `MM: Found <${HS.size(keys)}> registered keys over all subscriptions`
        )
      )

      if (HS.size(keys) > 0) {
        // TODO: Most likely it is better to use Chunk in the API rather than arrays
        const keyArr = [...keys]
        yield* $(T.logInfo(`polling metrics for <${keyArr.length}> keys`))
        const states = yield* $(getStates(keyArr))
        const published = yield* $(metricsHub.publishAll(states))
        yield* $(
          T.logDebug(
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

const withDefaultScheduler = FiberRef.locally(
  FiberRef.currentScheduler,
  Scheduler.defaultScheduler
)

export const live = L.effect(
  MetricsManager,
  T.gen(function* ($) {
    // TODO: Review the Hub configuration
    const hub = yield* $(Hub.unbounded<MetricState>())
    const insight = yield* $(T.service(Insight.InsightService))
    const idSvc = yield* $(T.service(IdSvc.IdGenerator))
    const subscriptions = yield* $(
      Ref.make(HMap.empty<string, HS.HashSet<InsightKey>>())
    )

    const mm = makeMetricsManager(idSvc, insight, hub, subscriptions)

    // working
    yield* $(
      withDefaultScheduler(
        T.forkDaemon(T.repeat(Sch.spaced(D.millis(2000)))(mm.poll()))
      )
    )

    yield* $(T.logDebug(`Started MetricsManager`))
    return mm
  })
)
