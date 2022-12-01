import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as Ref from "@effect/core/io/Ref"
import * as GDS from "./GraphDataService"
import * as Log from "@core/services/Logger"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as Sem from "@effect/core/stm/TSemaphore"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { pipe } from "@tsplus/stdlib/data/Function"

// The graph data manager provides map of ids to GraphDataServices. 
// While the GraphDataService manages the data for a single panel, 
// the GraphDataManager manages the GraphDataServices for an entire
// Dashboard.
// The motivation is to create the GraphDataManager inside the root 
// of a single Dashboard, so that the current state of retrieved metrics
// wont be lost if views are (un)mounted.

// The GraphDataManager lives in the runtime and as such is available 
// throughout the lifetime of the application. 

export interface PanelAlreadyRegistered{ 
  readonly _tag: "PanelAlreadyRegistered"
  readonly id: string
}

export interface UnknownPanel { 
  readonly _tag: "UnknownPanel"
  id: string
}

export type GraphDataManagerError = PanelAlreadyRegistered | UnknownPanel

export interface GraphDataManager {
  lookup: (panelId: string) => T.Effect<never, GraphDataManagerError, GDS.GraphDataService>
  register: (panelId: string) => T.Effect<never, GraphDataManagerError, GDS.GraphDataService>
  deregister: (panelId: string) => T.Effect<never, never, void>
}

export const GraphDataManager = Tag<GraphDataManager>()

function makeGraphDataManager(
  sem: Sem.TSemaphore,
  log: Log.LogService,
  services: Ref.Ref<HMap.HashMap<string, GDS.GraphDataService>>
) {

  const gdsById = (id: string) => pipe(
    services.get,
    T.map(HMap.get(id))
  )

  const lookupPanel = (panelId: string) =>
    Sem.withPermit(sem)(
      T.gen(function* ($) {

        yield* $(pipe(
          services.get,
          T.map(HMap.keys),
          T.map(Coll.toArray),
          T.map(a => a.join(",")),
          T.flatMap(log.debug)
        ))

        const mbSvc = yield* $(gdsById(panelId))
        switch(mbSvc._tag) { 
          case "None":
            return yield* $(T.fail(<UnknownPanel>{id: panelId}))
          case "Some":
            return mbSvc.value
        }
      })
    )

  const registerPanel = (panelId: string) => 
    Sem.withPermit(sem)(
      T.gen(function* ($) {
        const mbSvc = yield* $(gdsById(panelId))
        switch(mbSvc._tag){
          case "None":
            const gds = yield* $(GDS.createGraphDataService())
            yield* $(services.update(current => HMap.set(panelId, gds)(current)))
            yield* $(log.debug(`Created GraphDataService for ${panelId}`))
            return gds
          case "Some":
            return yield* $(T.fail(<PanelAlreadyRegistered>{id: panelId}))
        }
      })
    )

  const deregisterPanel = (panelId: string) => 
    Sem.withPermit(sem)(
      T.gen(function* ($){
        const mbSvc = yield* $(gdsById(panelId))
        switch(mbSvc._tag) { 
          case "None":
            return
          case "Some":
            yield* $(log.debug(`Closing GraphDataService for <${panelId}>`))
            yield* $(mbSvc.value.close())
            services.update(HMap.remove(panelId))
        }
      })
    )

  return T.sync(() => <GraphDataManager>{
    lookup: lookupPanel,
    register: registerPanel,
    deregister: deregisterPanel
  })
}

export const live : L.Layer<Log.LogService, never, GraphDataManager> = 
  L.fromEffect(GraphDataManager)(
    T.gen(function* ($) { 
      const log = yield* $(T.service(Log.LogService))
      const sem = yield* $(Sem.make(1))
      const svcMap = yield* $(Ref.makeRef<HMap.HashMap<string, GDS.GraphDataService>>(() =>HMap.empty()))
      return yield* $(makeGraphDataManager(sem, log, svcMap))
    })
  )
