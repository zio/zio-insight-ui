import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as L from "@effect/io/Layer"

import * as MM from "@core/metrics/services/MetricsManager"
import * as Log from "@core/services/Logger"
import * as MS from "@core/services/MemoryStore"

import * as GDS from "./GraphDataService"

// The graph data manager provides map a of ids to GraphDataServices.
// While the GraphDataService manages the data for a single panel,
// the GraphDataManager manages the GraphDataServices for an entire
// Dashboard.
// The motivation is to create the GraphDataManager inside the root
// of a single Dashboard, so that the current state of retrieved metrics
// won't be lost if views are (un)mounted.

// The GraphDataManager lives in the runtime and as such is available
// throughout the lifetime of the application.

export interface PanelAlreadyRegistered {
  readonly _tag: "PanelAlreadyRegistered"
  readonly id: string
}

export type GraphDataManagerError = PanelAlreadyRegistered

export interface GraphDataManager {
  lookup: (
    panelId: string
  ) => T.Effect<never, MS.KeyDoesNotExist<string>, GDS.GraphDataService>
  register: (
    panelId: string
  ) => T.Effect<never, GraphDataManagerError, GDS.GraphDataService>
  deregister: (panelId: string) => T.Effect<never, never, void>
}

export const GraphDataManager = Ctx.Tag<GraphDataManager>()

function makeGraphDataManager(
  store: MS.MemoryStore<string, GDS.GraphDataService>,
  mm: MM.MetricsManager,
  log: Log.LogService
) {
  const panelById = (panelId: string) =>
    pipe(
      store.get(panelId),
      T.map((v) => Opt.some(v)),
      T.catchAll((_) => T.sync(() => Opt.none() as Opt.Option<GDS.GraphDataService>))
    )

  const createGDS = () =>
    pipe(
      GDS.createGraphDataService(),
      T.provideService(Log.LogService, log),
      T.provideService(MM.MetricsManager, mm)
    )

  const lookupPanel = (panelId: string) => store.get(panelId)

  const registerPanel = (panelId: string) =>
    T.gen(function* ($) {
      const mbSvc = yield* $(panelById(panelId))
      switch (mbSvc._tag) {
        case "None":
          return yield* $(store.set(panelId, createGDS()))
        case "Some":
          return yield* $(T.fail({ id: panelId } as PanelAlreadyRegistered))
      }
    })

  const deregisterPanel = (panelId: string) =>
    store.remove(panelId, (gds) => gds.close())

  return {
    lookup: lookupPanel,
    register: registerPanel,
    deregister: deregisterPanel,
  } as GraphDataManager
}

export const live: L.Layer<
  Log.LogService | MM.MetricsManager,
  never,
  GraphDataManager
> = L.effect(
  GraphDataManager,
  T.gen(function* ($) {
    const log = yield* $(T.service(Log.LogService))
    const mm = yield* $(T.service(MM.MetricsManager))
    const store = yield* $(MS.createMemoryStore<string, GDS.GraphDataService>())
    return makeGraphDataManager(store, mm, log)
  })
)
