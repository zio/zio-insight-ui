import * as T from "@effect/core/io/Effect"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as MB from "@tsplus/stdlib/data/Maybe"
import * as AL from "@core/AppLayer"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import * as Insight from "@core/metrics/model/zio/MetricState"
import * as Log from "@core/services/Logger"
import states from "@data/state.json"
import { pipe } from "@tsplus/stdlib/data/Function"
import { 
  counterId, gaugeId, summaryId, histId, frequencyId
} from "../../../../../src/data/testkeys"
import * as MT from "@core/metrics/model/zio/MetricType"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

const makeKey = (name: string, metricType: MT.MetricType) => 
  <TS.TimeSeriesKey>{
    key: {
    id: name,
    key: {
      name: "foo",
      labels: [],
      metricType: metricType
    },
    },
    subKey: MB.none
  }

// just a helper to get time series entries from a state id 
const entries = (id : string) => 
  pipe(
    Insight.metricStatesFromInsight(states),
    T.map(states => (states.find(s => s.id == id))!),
    T.map(entry => TS.tsEntriesFromState(entry))
  )

describe("TimeSeries", () => {

  it("should start with an empty chunk of entries", async () => { 

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries(makeKey("foo", "Counter"), 2)(log))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should allow to record a time entry with a matching id", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const key = makeKey("foo", "Counter")
        const ts = yield* $(TS.makeTimeSeries(key, 2)(log))
        const e = <TS.TimeSeriesEntry>{
          id: key, 
          when: new Date(),
          value: 100
        }
        yield* $(ts.record(e))
        return yield* $(ts.entries())
      })
    )

    expect(C.size(res)).toEqual(1)
  })

  it("should not record a time entry with a non-matching id", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries(makeKey("foo", "Counter"), 2)(log))
        const e = <TS.TimeSeriesEntry>{
          id: makeKey("bar", "Counter"), 
          when: new Date(),
          value: 100
        }
        yield* $(ts.record(e))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should drop the oldest entry when the max number of entries is exceeded", async () => {

    const now = new Date()
    const key = makeKey("foo", "Counter")
    const entries = [...Array(5).keys()].map(n => 
      <TS.TimeSeriesEntry>{
        id: key,
        when: new Date(now.getTime() - n * 1000),
        value: n
      }
    ).reverse()

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries(key, 2)(log))
        yield* $(T.forEach(entries, e => ts.record(e)))
        return yield* $(ts.entries())
      })
    )

    const [e1, e2] = Coll.toArray(res)
    expect(e1.when.getTime()).toBeLessThan(e2.when.getTime())
    expect(e1.when.getTime()).toEqual(now.getTime() - 1000)
    expect(e2.when.getTime()).toEqual(now.getTime())
    expect(C.size(res)).toEqual(2)
  })
})

describe("TimeSeriesConvert", () => {

  it("should convert Counters", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(counterId)
    )

    expect(C.size(res)).toEqual(1)
    const entry = C.unsafeHead(res)
    expect(entry.value).toEqual(6410368)
  })

  it("should convert Gauges", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(gaugeId)
    )

    expect(C.size(res)).toEqual(1)
    const entry = C.unsafeHead(res)
    expect(entry.value).toEqual(-39.47982534263892)
  })

  it("should convert Summaries", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(summaryId)
    )

    expect(C.size(res)).toEqual(4)
  })

  it("should convert Frequencies", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(frequencyId)
    )

    expect(C.size(res)).toEqual(10)
  })

  it("should convert Histograms", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(histId)
    )

    expect(C.size(res)).toEqual(102)
  })

})