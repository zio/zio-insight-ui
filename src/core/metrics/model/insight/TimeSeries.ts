import * as T from "@effect/core/io/Effect"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Ref from "@effect/core/io/Ref"
import * as Log from "@core/services/Logger"
import { Ord } from "@tsplus/stdlib/prelude/Ord"
import { formatDate } from "@core/utils" 
import * as State from "@core/metrics/model/zio/MetricState"
import { pipe } from "@tsplus/stdlib/data/Function"

// A time series key uniquely defines a single measured piece of data over a 
// period of time
export type TimeSeriesKey = string

// The basic rendering config for a TimeSeries 
export interface TimeSeriesConfig {
  id: TimeSeriesKey
  title: string
  color: string
}

export class TimeSeriesEntry {
  readonly id: TimeSeriesKey
  readonly when: Date
  readonly value: number

  constructor(id: TimeSeriesKey, when: Date, value: number) {
    this.id = id
    this.when = when
    this.value = value
  }

  asString() : string {
    return `TimeSeriesEntry(${this.id}, ${formatDate(this.when)}, ${this.value})`
  }
}

const OrdTimeSeriesEntry = <Ord<TimeSeriesEntry>> { 
  compare: (x : TimeSeriesEntry, y: TimeSeriesEntry) => {
    if (x.when.getTime() < y.when.getTime()) return -1
    else if (x.when.getTime() > y.when.getTime()) return 1
    else return 0
  }
} 

export interface TimeSeries {
  readonly id: TimeSeriesKey

  readonly maxEntries:  () => T.Effect<never, never, number>
  readonly updateMaxEntries: (newMax: number) => T.Effect<never, never, void>

  readonly record: (_: TimeSeriesEntry) => T.Effect<never, never, void>
  readonly entries: () => T.Effect<never, never, C.Chunk<TimeSeriesEntry>>
}

export const makeTimeSeries = (id: String, maxEntries: number) => (log: Log.LogService) => {
  return (
    T.gen(function* ($){
      const maxRef = yield* $(Ref.makeRef(() => maxEntries))
      const entriesRef = yield* $(Ref.makeRef(() => C.empty<TimeSeriesEntry>()))

      const logPrefix = `TS <${id}> --`

      const restrictEntries = (entries: C.Chunk<TimeSeriesEntry>, max: number) => {
        if (max > 0) {
          if (C.size(entries) <= max) {
            return entries
          } else { 
            return C.sort(OrdTimeSeriesEntry)(C.takeRight(max)(entries))
          }
        } else { 
          return C.empty<TimeSeriesEntry>()
        }
      }

      return <TimeSeries>{
        id: id,
        maxEntries: () => maxRef.get,
        updateMaxEntries: (newMax: number) => pipe(
          maxRef.set(newMax),
          T.flatMap(_ => entriesRef.updateAndGet(curr => restrictEntries(curr, newMax))),
          T.flatMap(entries => log.debug(`${logPrefix} has now <${C.size(entries)}> entries`))
        ),
        record: (e: TimeSeriesEntry) => T.gen(function* ($){
          if (e.id == id) {
            const max = yield* $(maxRef.get)
            const curr = yield* $(entriesRef.get)
            const newEntries = () => restrictEntries(C.append(e)(curr), max) 
            yield* $(pipe(
              entriesRef.updateAndGet(_ => newEntries()),
              T.flatMap(entries => log.debug(`${logPrefix} has now <${C.size(entries)}> entries`))
            ))
          }
        }),
        entries: () => entriesRef.get
      }
    })
  )
}

export const timeEntriesFromState = (s: State.MetricState) => {

  const ts = new Date(s.timestamp)
  const res = <TimeSeriesEntry[]>[]

  switch(s.key.metricType){
    case "Counter":
      const counter = <State.CounterState>s.state
      res.push(new TimeSeriesEntry(
        s.id,
        ts,
        counter.count
      ))
      break
    case "Gauge":
      const gauge = <State.GaugeState>s.state
      res.push(new TimeSeriesEntry(
        s.id, ts, gauge.value
      ))
      break
    case "Histogram":
      const hist = <State.HistogramState>s.state
      hist.buckets.forEach( ([k, v]) => res.push(
        new TimeSeriesEntry(`${s.id}-${k}`, ts, v)
      ))
      if (hist.count > 0) {
        res.push(
          new TimeSeriesEntry(`${s.id}-avg`, ts, hist.sum / hist.count)
        )
      }
      break
    case "Summary":
      const summ = <State.SummaryState>s.state
      summ.quantiles.forEach( ([q,v]) => res.push(new TimeSeriesEntry(
        `${s.id}-${q}`, ts, v
      )))

      if (summ.count > 0) {
        res.push(new TimeSeriesEntry(
          `${s.id}-avg`, ts, summ.sum / summ.count
        ))
      }

      break
    case "Frequency":
      const freq = <State.FrequencyState>s.state
      HMap.forEachWithIndex<string, number>( (k, v) => 
        res.push(new TimeSeriesEntry(
          `${s.id}-${k}`, ts, v
        ))
      )(freq.occurrences)
      break
  }

  return C.from(res)
}

