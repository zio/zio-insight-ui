import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as L from "@effect/io/Layer"
import { MemoryStore } from "@services/Services"

import * as MM from "@core/metrics/services/MetricsManager"

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
  ) => T.Effect<never, MemoryStore.KeyDoesNotExist<string>, GDS.GraphDataService>
  register: (
    panelId: string
  ) => T.Effect<never, GraphDataManagerError, GDS.GraphDataService>
  deregister: (panelId: string) => T.Effect<never, never, void>
}

export const GraphDataManager = Ctx.Tag<GraphDataManager>()

function makeGraphDataManager(
  store: MemoryStore.MemoryStore<string, GDS.GraphDataService>,
  mm: MM.MetricsManager
) {
  const panelById = (panelId: string) =>
    pipe(
      store.get(panelId),
      T.map((v) => Opt.some(v)),
      T.catchAll((_) => T.sync(() => Opt.none() as Opt.Option<GDS.GraphDataService>))
    )

  const createGDS = () =>
    pipe(GDS.createGraphDataService(), T.provideService(MM.MetricsManager, mm))

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

export const live: L.Layer<MM.MetricsManager, never, GraphDataManager> = L.effect(
  GraphDataManager,
  T.gen(function* ($) {
    const mm = yield* $(MM.MetricsManager)
    const store = yield* $(
      MemoryStore.createMemoryStore<string, GDS.GraphDataService>()
    )
    return makeGraphDataManager(store, mm)
  })
)
