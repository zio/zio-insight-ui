import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as L from "@effect/core/io/Layer"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Hub from "@effect/core/io/Hub"
import * as Ref from "@effect/core/io/Ref"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Log from "@core/services/Logger"
import * as IdSvc from "@core/services/IdGenerator"
import * as Sch from "@effect/core/io/Schedule"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { InsightKey } from "@core/metrics/model/MetricKey";
import { MetricState } from "@core/metrics/model/MetricState";
import { pipe } from "@tsplus/stdlib/data/Function"
import * as D from "@tsplus/stdlib/data/Duration"

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
  readonly createSubscription : (keys: C.Chunk<InsightKey>) => T.Effect<never, never, string>
  // Allow components to completely remove their subscription
  readonly removeSubscription: (id: string) => T.Effect<never, never, void>
  // Modify a given subscription 
  readonly modifySubscription: (id: string, f: (_:C.Chunk<InsightKey>) => C.Chunk<InsightKey>) => T.Effect<never, never, void>
  // Get the union over all registered keys
  readonly registeredKeys: () => T.Effect<never, never, C.Chunk<InsightKey>>
  // create a stream for incoming Metric State updates
  readonly updates: () => T.Effect<never, never, S.Stream<never, never, MetricState>>
}

export const MetricsManager = Tag<MetricsManager>()

function makeMetricsManager(
  log: Log.LogService,
  idSvc: IdSvc.IdGenerator,
  metricsHub: Hub.Hub<MetricState>,
  subscriptions: Ref.Ref<HMap.HashMap<string, C.Chunk<InsightKey>>>
) { 

    // create a new subscription for a collection of InsightKeys, the new subscription will have a unique id 
    // that can be used to unsubscribe again
    const createSubscription = (keys: C.Chunk<InsightKey>) => pipe(
      idSvc.nextId("mm"),
      T.flatMap(id => pipe(
        log.debug(`Adding subscription <${id}> with <${keys.length}> keys to MetricsManager`),
        T.flatMap(_ => subscriptions.update(HMap.set(id, keys))),
        T.map(_ => id)
      ))
    )

    // remove the subscription with the given subscription id 
    const removeSubscription = (id: string) => pipe(
      log.debug(`Removing subscription <${id}> from MetricsManager`),
      T.flatMap(_ => subscriptions.update(HMap.remove(id)))
    )

    const modifySubscription = (id: string,  f: (_:C.Chunk<InsightKey>) => C.Chunk<InsightKey>) => pipe(
      log.debug(`Modifying subscription <${id}> in MetricsManager`),
      T.flatMap(_ => subscriptions.update(HMap.update(id, f)))
    )

    const registeredKeys = () => pipe(
      subscriptions.get,
      T.map( 
        HMap.reduce(
          C.empty<InsightKey>(),
          (z, v) => C.concat<InsightKey, InsightKey>(z)(v)
        )
      ),
      // TODO: can we do this more efficiently ??
      T.map(C.reduce(
        C.empty<InsightKey>(), 
        (curr, a) => {
          if ( (C.findIndex<InsightKey>(e => e.id == a.id)(curr))._tag == "Some" ) {
            return curr
           } else {
            return C.append(a)(curr)
           }
        }
      )),
      T.tap(res => log.debug(`Found <${res.length}> metric keys over all registrations`))
    )

    const updates = () => T.sync(() => S.fromHub(metricsHub))
      
  return pipe(
    T.forkDaemon(
      T.schedule(Sch.linear(D.millis(500)))(log.info("Hello"))
    ),
    T.map(_ => <MetricsManager>{
      createSubscription: createSubscription,
      removeSubscription: removeSubscription,
      modifySubscription: modifySubscription,
      registeredKeys: registeredKeys,
      updates : updates
    })
)}

export const live = 
  L.fromEffect(MetricsManager)(
    T.gen(function* ($) { 
      const hub = yield* $(Hub.sliding<MetricState>(512))
      const log = yield* $(T.service(Log.LogService))
      const ref = yield* $(Ref.makeRef(() => HMap.empty<string, C.Chunk<InsightKey>>()))
      const idSvc= yield* $(T.service(IdSvc.IdGenerator))
      return yield* $(makeMetricsManager(log, idSvc, hub, ref))
    })
  )

