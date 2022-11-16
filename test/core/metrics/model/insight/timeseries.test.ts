import * as T from "@effect/core/io/Effect"
import * as C from "@tsplus/stdlib/collections/Chunk"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as AL from "@core/AppLayer"
import * as TS from "@core/metrics/model/insight/TimeSeries"

const testRt = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime

describe("TimeSeries", () => {

  it("should start with an empty chunk of entries", async () => { 

    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const ts = yield* $(TS.makeTimeSeries("foo", 2))
        return yield* $(ts.entries())
      })
    )

    expect(C.isEmpty(res)).toEqual(true)
  })

  it("should allow to record a time entry with a matching id", async () => {
    const res = await testRt.unsafeRunPromise(
      T.gen(function* ($) {
        const ts = yield* $(TS.makeTimeSeries("foo", 2))
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
        const ts = yield* $(TS.makeTimeSeries("foo", 2))
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
        const ts = yield* $(TS.makeTimeSeries("foo", 2))
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