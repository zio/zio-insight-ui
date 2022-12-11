import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import * as GDS from "./GraphDataService"
import * as Log from "@core/services/Logger"
import * as MB from "@tsplus/stdlib/data/Maybe"
import * as MM from "@core/metrics/services/MetricsManager"
import * as MS from "@core/services/MemoryStore"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { pipe } from "@tsplus/stdlib/data/Function"

// The graph data manager provides map a of ids to GraphDataServices. 
// While the GraphDataService manages the data for a single panel, 
// the GraphDataManager manages the GraphDataServices for an entire
// Dashboard.
// The motivation is to create the GraphDataManager inside the root 
// of a single Dashboard, so that the current state of retrieved metrics
// won't be lost if views are (un)mounted.

// The GraphDataManager lives in the runtime and as such is available 
// throughout the lifetime of the application. 

export interface PanelAlreadyRegistered{ 
  readonly _tag: "PanelAlreadyRegistered"
  readonly id: string
}

export type GraphDataManagerError = PanelAlreadyRegistered

export interface GraphDataManager {
  lookup: (panelId: string) => T.Effect<never, MS.KeyDoesNotExist<string>, GDS.GraphDataService>
  register: (panelId: string) => T.Effect<never, GraphDataManagerError, GDS.GraphDataService>
  deregister: (panelId: string) => T.Effect<never, never, void>
}

export const GraphDataManager = Tag<GraphDataManager>()

function makeGraphDataManager(
  store: MS.MemoryStore<string, GDS.GraphDataService>,
  mm: MM.MetricsManager,
  log: Log.LogService
) {

  const panelById = (panelId: string) => 
    pipe(
      store.get(panelId),
      T.map(v => MB.some(v)),
      T.catchAll(_ => T.sync(() => <MB.Maybe<GDS.GraphDataService>>MB.none))
    )

  const createGDS = () => pipe(
    GDS.createGraphDataService(),
    T.provideService(Log.LogService, log),
    T.provideService(MM.MetricsManager, mm)
  )

  const lookupPanel = (panelId: string) => store.get(panelId)

  const registerPanel = (panelId: string) => 
    T.gen(function* ($) {
      const mbSvc = yield* $(panelById(panelId))
      switch(mbSvc._tag){
        case "None":
          return yield* $(store.set(panelId, createGDS()))        
        case "Some":
          return yield* $(T.fail(<PanelAlreadyRegistered>{id: panelId}))
      }
    })

  const deregisterPanel = (panelId: string) => store.remove(panelId, gds => gds.close())

  return <GraphDataManager>{
    lookup: lookupPanel,
    register: registerPanel,
    deregister: deregisterPanel
  }
}

export const live : L.Layer<Log.LogService | MM.MetricsManager, never, GraphDataManager> = 
  L.fromEffect(GraphDataManager)(
    T.gen(function* ($) { 
      const log = yield* $(T.service(Log.LogService))
      const mm = yield* $(T.service(MM.MetricsManager))
      const store = yield* $(MS.createMemoryStore<string, GDS.GraphDataService>())
      return makeGraphDataManager(store, mm, log)
    })
  )
