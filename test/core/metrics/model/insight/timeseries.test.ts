import * as T from "@effect/core/io/Effect"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as AL from "@core/AppLayer"
import * as TS from "@core/metrics/model/insight/TimeSeries"
import * as Insight from "@core/metrics/model/zio/MetricState"
import * as Log from "@core/services/Logger"
import states from "@data/state.json"
import { pipe } from "@tsplus/stdlib/data/Function"
import { 
  counterId, gaugeId, summaryId, histId, frequencyId
} from "../../../../../src/data/testkeys"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

// just a helper to get time series entries from a state id 
const entries = (id : string) => 
  pipe(
    Insight.metricStatesFromInsight(states),
    T.map(states => (states.find(s => s.id == id))!),
    T.map(entry => TS.timeEntriesFromState(entry))
  )

describe("TimeSeries", () => {

  it("should start with an empty chunk of entries", async () => { 

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries("foo", 2)(log))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should allow to record a time entry with a matching id", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries("foo", 2)(log))
        const e = <TS.TimeSeriesEntry>{
          id: "foo", 
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
        const ts = yield* $(TS.makeTimeSeries("foo", 2)(log))
        const e = <TS.TimeSeriesEntry>{
          id: "bar", 
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
    const entries = [...Array(5).keys()].map(n => 
      <TS.TimeSeriesEntry>{
        id: "foo",
        when: new Date(now.getTime() - n * 1000),
        value: n
      }
    ).reverse()

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const log = yield* $(T.service(Log.LogService))
        const ts = yield* $(TS.makeTimeSeries("foo", 2)(log))
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
    expect(entry.when.getTime()).toEqual(1667907602305)
  })

  it("should convert Gauges", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(gaugeId)
    )

    expect(C.size(res)).toEqual(1)
    const entry = C.unsafeHead(res)
    expect(entry.value).toEqual(13)
    expect(entry.when.getTime()).toEqual(1667911737296)
  })

  it("should convert Summaries", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(summaryId)
    )

    expect(C.size(res)).toEqual(4)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.when.getTime() == 1667911742303)(res)).toBe(true)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.id.startsWith(summaryId))(res)).toBe(true)
  })

  it("should convert Frequencies", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(frequencyId)
    )

    expect(C.size(res)).toEqual(10)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.when.getTime() == 1667911742303)(res)).toBe(true)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.id.startsWith(frequencyId))(res)).toBe(true)
  })

  it("should convert Histograms", async () => { 

    const res = await testRt.unsafeRunPromise(
      entries(histId)
    )

    expect(C.size(res)).toEqual(102)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.when.getTime() == 1667894807289)(res)).toBe(true)
    expect(C.forAll<TS.TimeSeriesEntry>(ts => ts.id.startsWith(histId))(res)).toBe(true)
  })

})