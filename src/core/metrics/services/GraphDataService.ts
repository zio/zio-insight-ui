import type * as C from "@effect/data/Chunk"
import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as HSet from "@effect/data/HashSet"
import * as T from "@effect/io/Effect"
import * as F from "@effect/io/Fiber"
import * as Hub from "@effect/io/Hub"
import * as Ref from "@effect/io/Ref"
import * as S from "@effect/stream/Stream"

import * as TS from "@core/metrics/model/insight/TimeSeries"
import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import * as MM from "@core/metrics/services/MetricsManager"

import type { MetricState } from "../model/zio/metrics/MetricState"

// The Graph Data Service provides the data for a visual widget on the dashboard.
// Each widget must have a unique id (i.e retrieved via the IdService), the widget
// will register its interest in one or more metrics and set the number of data
// points that shall be stored.

export type GraphData = HMap.HashMap<TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>>

export interface GraphDataService {
  subscription: string
  // set the list of currently observed metric keys
  setMetrics: (keys: HSet.HashSet<InsightKey>) => T.Effect<never, never, void>
  // get the current set of observed keys
  metrics: () => T.Effect<never, never, HSet.HashSet<InsightKey>>
  // adjust the maximum number of observed data points
  setMaxEntries: (newMax: number) => T.Effect<never, never, void>
  // get the current maxEntries setting
  maxEntries: () => T.Effect<never, never, number>
  // The snapshot of the currently accumulated data
  current: () => T.Effect<never, never, GraphData>
  // A stream of snapshots
  data: () => T.Effect<never, never, S.Stream<never, never, GraphData>>
  // close
  close: () => T.Effect<never, never, void>
}

export const GraphDataService = Ctx.Tag<GraphDataService>()

export const defaultMaxEntries = 20

function makeGraphDataService(
  mm: MM.MetricsManager,
  subscriptionId: string,
  timeseries: Ref.Ref<HMap.HashMap<TS.TimeSeriesKey, TS.TimeSeries>>,
  observed: Ref.Ref<HSet.HashSet<InsightKey>>,
  currMaxEntries: Ref.Ref<number>,
  dataHub: Hub.Hub<GraphData>,
  stopped: Ref.Ref<boolean>
) {
  // create a new TimeSeries with a given id with the current number of max entries
  const createTS = (id: TS.TimeSeriesKey) =>
    T.gen(function* ($) {
      const max = yield* $(Ref.get(currMaxEntries))
      yield* $(T.logDebug(`creating new Timeseries`))
      return yield* $(TS.makeTimeSeries(id, max))
    })

  const getOrCreateTS = (id: TS.TimeSeriesKey) =>
    T.gen(function* ($) {
      const mbTS = yield* $(
        pipe(
          Ref.get(timeseries),
          T.map((ts) => HMap.get(ts, id))
        )
      )

      switch (mbTS._tag) {
        case "None":
          return yield* $(
            pipe(
              createTS(id),
              T.flatMap((ts) =>
                pipe(Ref.updateAndGet(timeseries, HMap.set(id, ts)), T.as(ts))
              )
            )
          )
        case "Some":
          return mbTS.value
      }
    })

  const current = () =>
    T.gen(function* ($) {
      const ts = yield* $(Ref.get(timeseries))

      const snapshot: C.Chunk<[TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>]> =
        yield* $(
          T.forEach(ts, ([id, series]) =>
            pipe(
              series.entries(),
              T.map(
                (entries) =>
                  [id, entries] as [TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>]
              )
            )
          )
        )

      return HMap.fromIterable<TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>>(snapshot)
    })

  // This will be started in the background to consume metric updates from the metrics manager and update
  // the accumulated graph data
  const subscriber = () =>
    T.gen(function* ($) {
      const strState = yield* $(mm.updates())
      const logPrefix = `GDS <${subscriptionId}> - `

      // Handle a single metric state update
      const handleMetricState = (ms: MetricState) =>
        T.gen(function* ($) {
          yield* $(
            T.logDebug(`<${logPrefix}> - received state update ${JSON.stringify(ms)}`)
          )

          const contains = yield* $(
            pipe(
              Ref.get(observed),
              T.map(HSet.filter((k) => k.id == ms.id)),
              T.map(HSet.size),
              T.map((s) => s > 0)
            )
          )

          if (contains) {
            const tsEntries = TS.tsEntriesFromState(ms)
            yield* $(
              T.forEach(tsEntries, (e) =>
                pipe(
                  getOrCreateTS(e.id),
                  T.flatMap((ts) => ts.record(e))
                )
              )
            )
            yield* $(
              pipe(
                current(),
                T.flatMap((d) => dataHub.offer(d)),
                T.flatMap((b) =>
                  T.logDebug(
                    `GDS <${subscriptionId}> - published timeseries to hub : ${b}`
                  )
                )
              )
            )
          }
        })

      const runner = pipe(
        S.takeUntilEffect<MetricState, never, never>((_) => Ref.get(stopped))(strState),
        S.runForEach(handleMetricState)
      )

      return yield* $(T.forkDaemon(runner))
    })

  const setMetrics = (keys: HSet.HashSet<InsightKey>) =>
    T.gen(function* ($) {
      const ids = HSet.map(keys, (k) => k.id)
      yield* $(mm.modifySubscription(subscriptionId, (_) => HSet.fromIterable(keys)))

      yield* $(
        Ref.update(timeseries, (curr) => {
          return HMap.reduceWithIndex(
            curr,
            HMap.empty<TS.TimeSeriesKey, TS.TimeSeries>(),
            (
              s: HMap.HashMap<TS.TimeSeriesKey, TS.TimeSeries>,
              v: TS.TimeSeries,
              k: TS.TimeSeriesKey
            ) => {
              if (HSet.has(ids, k.key.id)) {
                return HMap.set(s, k, v)
              } else {
                return s
              }
            }
          )
        })
      )

      yield* $(T.logDebug(`GraphData Services now observes <${HSet.size(keys)}> keys`))
      yield* $(Ref.set(observed, keys))
    })

  const metrics = () => Ref.get(observed)

  const setMaxEntries = (newMax: number) =>
    T.gen(function* ($) {
      const series = yield* $(Ref.get(timeseries))
      yield* $(T.forEach(HMap.values(series), (ts) => ts.updateMaxEntries(newMax)))
      yield* $(Ref.set(currMaxEntries, newMax))
    })

  const maxEntries = () => Ref.get(currMaxEntries)

  const data = () => T.succeed(S.fromHub(dataHub))

  return pipe(
    subscriber(),
    T.flatMap((f) =>
      T.sync(() => {
        return {
          subscription: subscriptionId,
          setMetrics,
          metrics,
          setMaxEntries,
          maxEntries,
          current,
          data,
          close: () =>
            pipe(
              Ref.set(stopped, true),
              T.flatMap((_) => mm.removeSubscription(subscriptionId)),
              T.flatMap((_) => F.interrupt(f))
            ),
        } as GraphDataService
      })
    )
  )
}

export function createGraphDataService() {
  // TODO: Review Hub settings
  return T.gen(function* ($) {
    const mm = yield* $(MM.MetricsManager)
    const observed = yield* $(Ref.make(HSet.empty()))
    const maxEntries = yield* $(Ref.make(defaultMaxEntries))
    const timeSeries = yield* $(Ref.make(HMap.empty()))
    const subId = yield* $(mm.createSubscription(HSet.empty()))
    const stopped = yield* $(Ref.make(false))
    const dataHub = yield* $(Hub.sliding<GraphData>(128))
    return yield* $(
      makeGraphDataService(
        mm,
        subId,
        timeSeries,
        observed,
        maxEntries,
        dataHub,
        stopped
      )
    )
  })
}
