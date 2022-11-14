import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as L from "@effect/core/io/Layer"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Hub from "@effect/core/io/Hub"
import * as Ref from "@effect/core/io/Ref"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Log from "@core/services/Logger"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { InsightKey } from "@core/metrics/model/MetricKey";
import { MetricState } from "@core/metrics/model/MetricState";
import { pipe } from "@tsplus/stdlib/data/Function"

// The MetricsManager is a service where interested components can add InsightKeys 
// to register their interest in those keys. Internally the MetricsManager will poll 
// the ZIO application on a regular basis to obtain the state of all registered keys.
// Components can obtain a stream of MetricState updates, and for now all components 
// will see all updates in the stream - even the updates for keys they haven´t expressed 
// interest in. As a result they have to filter for the events of interest themselves. 
// Components can deregister their interest in particular keys and if no more components 
// are interested in a particular key, the MetricsManager will stop polling for the 
// corresponding metric state. 

export interface MetricsManager {
  // Allow components to register their interest in particular keys
  setSubscription : (id: string, keys: C.Chunk<InsightKey>) => T.Effect<never, never, void>
  // Allow components to completely remove their subscription
  removeSubscription: (id: string) => T.Effect<never, never, void>
  // Modify a given subscription 
  modifySubscription: (id: string, f: (_:C.Chunk<InsightKey>) => C.Chunk<InsightKey>) => T.Effect<never, never, void>
  // Get the union over all registered keys
  registeredKeys: () => T.Effect<never, never, C.Chunk<InsightKey>>
  // create a stream for incoming Metric State updates
  updates: T.Effect<never, never, S.Stream<never, never, MetricState>>
}

export const MetricsManager = Tag<MetricsManager>()

function makeMetricsManager(
  log: Log.LogService,
  metricsHub: Hub.Hub<MetricState>,
  subscriptions: Ref.Ref<HMap.HashMap<string, C.Chunk<InsightKey>>>
) { return T.sync( () => 
  <MetricsManager>{
    // create a new subscription for a collection of InsightKeys, the new subscription will have a unique id 
    // that can be used to unsubscribe again
    setSubscription: (id: string, keys: C.Chunk<InsightKey>) => pipe(
      log.debug(`Adding subscription <${id}> with <${keys.length}> keys to MetricsManager`),
      T.flatMap(_ => subscriptions.update(HMap.set(id, keys)))
    ),
    // remove the subscription with the given subscription id 
    removeSubscription: (id: string) => pipe(
      log.debug(`Removing subscription <${id}> from MetricsManager`),
      T.flatMap(_ => subscriptions.update(HMap.remove(id)))
    ),
    modifySubscription: (id: string,  f: (_:C.Chunk<InsightKey>) => C.Chunk<InsightKey>) => pipe(
      log.debug(`Modifying subscription <${id}> in MetricsManager`),
      T.flatMap(_ => subscriptions.update(HMap.update(id, f)))
    ),
    registeredKeys: () => pipe(
      subscriptions.get,
      T.map( 
        HMap.reduce(
          C.empty<InsightKey>(),
          (z, v) => C.concat<InsightKey, InsightKey>(z)(v)
        )
      ),
      T.tap(res => log.debug(`Found <${res.length}> metric keys over all registrations`))
    ),
    updates : T.sync(() => S.fromHub(metricsHub))
  }
)}

export const live = 
  L.fromEffect(MetricsManager)(
    T.gen(function* ($) { 
      const hub = yield* $(Hub.sliding<MetricState>(512))
      const log = yield* $(T.service(Log.LogService))
      const ref = yield* $(Ref.makeRef(() => HMap.empty<string, C.Chunk<InsightKey>>()))
      return yield* $(makeMetricsManager(log, hub, ref))
    })
  )

