import * as T from "@effect/core/io/Effect"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Ref from "@effect/core/io/Ref"
import { Ord } from "@tsplus/stdlib/prelude/Ord"
import * as MayBe from "@tsplus/stdlib/data/Maybe"

// A time series key uniquely defines a single measured piece of data over a 
// period of time
export type TimeSeriesKey = string

// The basic rendering config for a TimeSeries 
export interface TimeSeriesConfig {
  id: TimeSeriesKey
  title: string
  color: string
}

export interface TimeSeriesEntry {
  id: TimeSeriesKey
  when: Date
  value: number
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

export const makeTimeSeries = (id: String, maxEntries: number) => {
  return (
    T.gen(function* ($){
      const maxRef = yield* $(Ref.makeRef(() => maxEntries))
      const entriesRef = yield* $(Ref.makeRef(() => C.empty<TimeSeriesEntry>()))

      return <TimeSeries>{
        id: id,
        maxEntries: () => maxRef.get,
        updateMaxEntries: (newMax: number) => maxRef.set(newMax),
        record: (e: TimeSeriesEntry) => T.gen(function* ($){
          if (e.id == id) {
            const max = yield* $(maxRef.get)
            const curr = yield* $(entriesRef.get)
            const newEntries = () => {
              if (C.size(curr) == max) {
                return C.sort(OrdTimeSeriesEntry)(C.append(e)(MayBe.getOrElse(() => C.empty())(C.tail(curr))))
              } else {
                return C.sort(OrdTimeSeriesEntry)(C.append(e)(curr))
              }
            }
            yield* $(entriesRef.set(newEntries()))
          }
        }),
        entries: () => entriesRef.get
      }
    })
  )
}