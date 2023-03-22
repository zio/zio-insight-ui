import * as C from "@effect/data/Chunk"
import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as Opt from "@effect/data/Option"
import type { Order } from "@effect/data/typeclass/Order"
import * as T from "@effect/io/Effect"
import * as Ref from "@effect/io/Ref"

import * as Color from "@core/Color"
import type * as MK from "@core/metrics/model/zio/metrics/MetricKey"
import type * as State from "@core/metrics/model/zio/metrics/MetricState"
import type * as Log from "@core/services/Logger"
import { formatDate } from "@core/utils"

// A time series key uniquely defines a single measured piece of data over a
// period of time
export class TimeSeriesKey {
  constructor(readonly key: MK.InsightKey, readonly subKey: Opt.Option<string>) {}
}

// The basic rendering config for a TimeSeries
export class TimeSeriesConfig {
  readonly tension: number
  readonly lineColor: Color.Color
  readonly pointColor: Color.Color

  constructor(
    readonly id: TimeSeriesKey,
    readonly title: string,
    tension?: number,
    lineColor?: Color.Color,
    pointColor?: Color.Color
  ) {
    this.tension = tension || Math.floor(Math.random() * 3 + 3) / 10
    this.lineColor = lineColor || Color.fromRandom()
    this.pointColor = pointColor || Color.fromRandom()
  }
}

export class TimeSeriesEntry {
  constructor(
    readonly id: TimeSeriesKey,
    readonly when: Date,
    readonly value: number
  ) {}

  asString(): string {
    return `TimeSeriesEntry(${this.id}, ${formatDate(this.when)}, ${this.value})`
  }
}

const OrdTimeSeriesEntry = {
  compare: (x: TimeSeriesEntry, y: TimeSeriesEntry) => {
    if (x.when.getTime() < y.when.getTime()) return -1
    else if (x.when.getTime() > y.when.getTime()) return 1
    else return 0
  },
} as Order<TimeSeriesEntry>

export interface TimeSeries {
  readonly id: TimeSeriesKey

  readonly maxEntries: () => T.Effect<never, never, () => number>
  readonly updateMaxEntries: (newMax: number) => T.Effect<never, never, void>

  readonly record: (_: TimeSeriesEntry) => T.Effect<never, never, void>
  readonly entries: () => T.Effect<never, never, C.Chunk<TimeSeriesEntry>>
}

export const makeTimeSeries =
  (id: TimeSeriesKey, maxEntries: number) => (log: Log.LogService) => {
    return T.gen(function* ($) {
      const maxRef = yield* $(Ref.make(() => maxEntries))
      const entriesRef = yield* $(Ref.make(() => C.empty<TimeSeriesEntry>()))

      const logPrefix = `TS <${id.key.id}-${Opt.getOrElse(() => "")(id.subKey)}> --`

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

      return {
        id,
        maxEntries: () => Ref.get(maxRef),
        updateMaxEntries: (newMax: number) =>
          pipe(
            Ref.set(maxRef, () => newMax),
            T.flatMap((_) =>
              Ref.updateAndGet(
                entriesRef,
                (curr) => () => restrictEntries(curr(), newMax)
              )
            ),
            T.flatMap((entries) =>
              log.debug(`${logPrefix} has now <${C.size(entries())}> entries`)
            )
          ),
        record: (e: TimeSeriesEntry) =>
          T.gen(function* ($) {
            if (JSON.stringify(id) === JSON.stringify(e.id)) {
              const max = yield* $(Ref.get(maxRef))
              const curr = yield* $(Ref.get(entriesRef))
              const newEntries = () => restrictEntries(C.append(e)(curr()), max())
              yield* $(
                pipe(
                  Ref.updateAndGet(entriesRef, (_) => newEntries),
                  T.flatMap((entries) =>
                    log.debug(`${logPrefix} has now <${C.size(entries())}> entries`)
                  )
                )
              )
            }
          }),
        entries: () =>
          pipe(
            Ref.get(entriesRef),
            T.map((e) => e())
          ),
      } as TimeSeries
    })
  }

export const tsEntriesFromState = (s: State.MetricState) => {
  const ts = new Date(s.retrieved)
  const res = [] as TimeSeriesEntry[]

  switch (s.key.metricType) {
    case "Counter": {
      const counter = s.state as State.CounterState
      res.push(
        new TimeSeriesEntry(
          { key: s.insightKey(), subKey: Opt.none() },
          ts,
          counter.count
        )
      )
      break
    }
    case "Gauge": {
      const gauge = s.state as State.GaugeState
      res.push(
        new TimeSeriesEntry(
          { key: s.insightKey(), subKey: Opt.none() },
          ts,
          gauge.value
        )
      )
      break
    }
    case "Histogram": {
      const hist = s.state as State.HistogramState
      hist.buckets.forEach(([k, v]) =>
        res.push(
          new TimeSeriesEntry({ key: s.insightKey(), subKey: Opt.some(`${k}`) }, ts, v)
        )
      )
      if (hist.count > 0) {
        res.push(
          new TimeSeriesEntry(
            { key: s.insightKey(), subKey: Opt.some("avg") },
            ts,
            hist.sum / hist.count
          )
        )
      }
      break
    }
    case "Summary": {
      const summ = s.state as State.SummaryState
      summ.quantiles.forEach(([q, v]) =>
        res.push(
          new TimeSeriesEntry({ key: s.insightKey(), subKey: Opt.some(`${q}`) }, ts, v)
        )
      )

      if (summ.count > 0) {
        res.push(
          new TimeSeriesEntry(
            { key: s.insightKey(), subKey: Opt.some("avg") },
            ts,
            summ.sum / summ.count
          )
        )
      }

      break
    }
    case "Frequency": {
      const freq = s.state as State.FrequencyState
      HMap.forEachWithIndex<string, number>((k, v) =>
        res.push(
          new TimeSeriesEntry({ key: s.insightKey(), subKey: Opt.some(`${k}`) }, ts, v)
        )
      )(freq.occurrences)
      break
    }
  }

  return C.fromIterable(res)
}
