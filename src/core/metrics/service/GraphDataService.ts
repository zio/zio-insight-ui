import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as F from "@effect/core/io/Fiber"
import * as Hub from "@effect/core/io/Hub"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as HSet from "@tsplus/stdlib/collections/HashSet"
import * as Ref from "@effect/core/io/Ref"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import { InsightKey } from "@core/metrics/model/zio/MetricKey"
import { Tag } from "@tsplus/stdlib/service/Tag"
import * as Log from "@core/services/Logger"
import * as MM from "@core/metrics/service/MetricsManager"
import { pipe } from "@tsplus/stdlib/data/Function"
import { MetricState }  from "../model/zio/MetricState"

// The Graph Data Service provides the data for a visual widget on the dashboard. 
// Each widget must have a unique id (i.e retrieved via the IdService), the widget 
// will register its interest in one or more metrics and set the number of data
// points that shall be stored. 

export type GraphData = 
  HMap.HashMap<TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>>

export interface GraphDataService {
  subscription: string
  // set the list of currently observed metric keys
  setMetrics: (...keys: InsightKey[]) => T.Effect<never, never, void>
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

export const GraphDataService = Tag<GraphDataService>()

export const defaultMaxEntries = 10

function makeGraphDataService(
  log: Log.LogService,
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
      const max = yield* $(currMaxEntries.get)
      yield* $(log.debug(`creating new Timeseries`))
      return yield* $(TS.makeTimeSeries(id, max)(log))
    })

  const getOrCreateTS = (id: TS.TimeSeriesKey) =>
    T.gen(function* ($) {
      const mbTS = yield* $(pipe(
        timeseries.get,
        T.map(HMap.get(id))
      ))

      switch (mbTS._tag) {
        case "None": 
          return yield* $(pipe(
            createTS(id),
            T.flatMap(ts => 
              pipe(
                timeseries.updateAndGet(HMap.set(id, ts)),
                T.as(ts)
              )
            )
          )) 
        case "Some":
          return mbTS.value
      }
    })

  const current = () => T.gen(function* ($) {
    const ts = yield* $(timeseries.get)

    const snapshot : C.Chunk<[TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>]> = yield* $(
      T.forEach(ts, ([id, series]) => pipe(
        series.entries(),
        T.map(entries => <[TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>]>[id, entries])
      ))
    )

    return HMap.from<TS.TimeSeriesKey, C.Chunk<TS.TimeSeriesEntry>>(snapshot)
  })
  
  // This will be started in the background to consume metric updates from the metrics manager and update 
  // the accumulated graph data
  const subscriber = () => T.gen(function* ($) {
    const strState = yield* $(mm.updates())

    // Handle a single metric state update 
    const handleMetricState = (ms : MetricState) => 
      T.gen(function* ($) {
        yield* $(log.debug(`GDS <${subscriptionId}> - received state update ${JSON.stringify(ms)}`))

        const contains = yield* $(
          pipe(
            observed.get,
            T.map(HSet.filter(k => k.id == ms.id)),
            T.map(HSet.size),
            T.map(s => s > 0)
          )
        )

        if (contains) { 
          const tsEntries = TS.tsEntriesFromState(ms)
          yield* $(T.forEach(tsEntries, e => pipe(
            getOrCreateTS(e.id),
            T.flatMap(ts => ts.record(e)),
          )))
          yield* $(
            pipe(
              current(),
              T.flatMap(d => dataHub.offer(d))
              )
          )
        }
      })

    const runner = pipe(
      S.takeUntilEffect<MetricState, never, never>(_ => stopped.get)(strState),
      S.runForEach(handleMetricState) 
    )

    return yield* $(T.forkDaemon(runner))
  })
  
  const setMetrics = (...keys: InsightKey[]) => 
    T.gen(function * ($) {
      const ids = keys.map(k => k.id)
      const newSet = HSet.from(keys)      
      yield *$(mm.modifySubscription(subscriptionId, _ => C.from(keys)))

      yield* $(timeseries.update(curr => 
        HMap.reduceWithIndex(HMap.empty<TS.TimeSeriesKey, TS.TimeSeries>(),
          (s: HMap.HashMap<TS.TimeSeriesKey, TS.TimeSeries>, k: TS.TimeSeriesKey, v: TS.TimeSeries) => {
            if (ids.find(e => e == k.key.id) != undefined) {
              return HMap.set(k, v)(s)
            } else {
              return s
            }
          }
        )(curr)
      ))
      
      yield* $(log.debug(`GraphData Services now observes <${HSet.size(newSet)}> keys`))
      yield* $(observed.set(newSet))
    })

  const metrics = () => observed.get

  const setMaxEntries = (newMax : number) => 
    T.gen(function* ($) {
      const series = yield* $(timeseries.get)
      yield* $(T.forEach(HMap.values(series), ts => ts.updateMaxEntries(newMax)))
      yield* $(currMaxEntries.set(newMax))
    })

  const maxEntries = () => currMaxEntries.get


  const data = () => T.sync(() => S.fromHub(dataHub))

  return pipe(
    subscriber(),
    T.flatMap(f => T.sync(() => <GraphDataService>{
      subscription: subscriptionId,
      setMetrics: setMetrics,
      metrics: metrics,
      setMaxEntries: setMaxEntries,
      maxEntries: maxEntries,
      current: current,
      data: data,
      close: () => pipe(
        stopped.set(true),
        T.flatMap(_ => mm.removeSubscription(subscriptionId)),
        T.flatMap(_ => F.interrupt(f))
      )
    }))
  )
}

export function createGraphDataService() {
  // TODO: Review Hub settings
  return T.gen(function* ($) { 
    const log = yield* $(T.service(Log.LogService))
    const mm = yield* $(T.service(MM.MetricsManager))
    const observed = yield* $(Ref.makeRef(() => HSet.empty()))
    const maxEntries = yield* $(Ref.makeRef(() => defaultMaxEntries))
    const timeSeries = yield* $(Ref.makeRef(() => HMap.empty()))
    const subId = yield* $(mm.createSubscription(C.empty()))
    const stopped = yield* $(Ref.makeRef(() => false))
    const dataHub = yield* $(Hub.sliding<GraphData>(128))
    return yield* $(makeGraphDataService(log, mm, subId, timeSeries, observed, maxEntries, dataHub, stopped))
  })
}
  