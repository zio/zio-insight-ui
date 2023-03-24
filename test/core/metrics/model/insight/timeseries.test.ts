import states from "@data/state.json"
import * as C from "@effect/data/Chunk"
import { pipe } from "@effect/data/Function"
import * as Opt from "@effect/data/Option"
import * as T from "@effect/io/Effect"
import * as RT from "@effect/io/Runtime"

import * as AL from "@core/AppLayer"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import * as Insight from "@core/metrics/model/zio/metrics/MetricState"
import type * as MT from "@core/metrics/model/zio/metrics/MetricType"

import {
  counterId,
  frequencyId,
  gaugeId,
  histId,
  summaryId,
} from "../../../../../src/data/testkeys"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

const makeKey = (name: string, metricType: MT.MetricType) => {
  return {
    key: {
      id: name,
      key: {
        name: "foo",
        labels: [],
        metricType,
      },
    },
    subKey: Opt.none(),
  } as TS.TimeSeriesKey
}

// just a helper to get time series entries from a state id
const entries = (id: string) =>
  pipe(
    Insight.metricStatesFromInsight(states),
    T.map((states) => C.findFirst(states, (s) => s.id == id)),
    T.map((entry) =>
      Opt.isSome(entry)
        ? TS.tsEntriesFromState(entry.value)
        : C.empty<TS.TimeSeriesEntry>()
    )
  )

describe("TimeSeries", () => {
  it("should start with an empty chunk of entries", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const ts = yield* $(TS.makeTimeSeries(makeKey("foo", "Counter"), 2))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should allow to record a time entry with a matching id", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const key = makeKey("foo", "Counter")
        const ts = yield* $(TS.makeTimeSeries(key, 2))
        const e = {
          id: key,
          when: new Date(),
          value: 100,
        } as TS.TimeSeriesEntry
        yield* $(ts.record(e))
        return yield* $(ts.entries())
      })
    )

    expect(C.size(res)).toEqual(1)
  })

  it("should not record a time entry with a non-matching id", async () => {
    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const ts = yield* $(TS.makeTimeSeries(makeKey("foo", "Counter"), 2))
        const e = {
          id: makeKey("bar", "Counter"),
          when: new Date(),
          value: 100,
        } as TS.TimeSeriesEntry
        yield* $(ts.record(e))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should drop the oldest entry when the max number of entries is exceeded", async () => {
    const now = new Date()
    const key = makeKey("foo", "Counter")
    const entries = [...Array(5).keys()]
      .map((n) => {
        return {
          id: key,
          when: new Date(now.getTime() - n * 1000),
          value: n,
        } as TS.TimeSeriesEntry
      })
      .reverse()

    const res = await RT.runPromise(testRt)(
      T.gen(function* ($) {
        const ts = yield* $(TS.makeTimeSeries(key, 2))
        yield* $(T.forEach(entries, (e) => ts.record(e)))
        return yield* $(ts.entries())
      })
    )

    const [e1, e2] = C.toReadonlyArray(res)
    expect(e1.when.getTime()).toBeLessThan(e2.when.getTime())
    expect(e1.when.getTime()).toEqual(now.getTime() - 1000)
    expect(e2.when.getTime()).toEqual(now.getTime())
    expect(C.size(res)).toEqual(2)
  })
})

describe("TimeSeriesConvert", () => {
  it("should convert Counters", async () => {
    const res = await RT.runPromise(testRt)(entries(counterId))

    expect(C.size(res)).toEqual(1)
    const entry = C.unsafeHead(res)
    expect(entry.value).toEqual(6410368)
  })

  it("should convert Gauges", async () => {
    const res = await RT.runPromise(testRt)(entries(gaugeId))

    expect(C.size(res)).toEqual(1)
    const entry = C.unsafeHead(res)
    expect(entry.value).toEqual(-39.47982534263892)
  })

  it("should convert Summaries", async () => {
    const res = await RT.runPromise(testRt)(entries(summaryId))
    expect(C.size(res)).toEqual(4)
  })

  it("should convert Frequencies", async () => {
    const res = await RT.runPromise(testRt)(entries(frequencyId))
    expect(C.size(res)).toEqual(10)
  })

  it("should convert Histograms", async () => {
    const res = await RT.runPromise(testRt)(entries(histId))
    expect(C.size(res)).toEqual(102)
  })
})
