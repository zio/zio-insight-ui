import keysObj from "@data/keys.json"
import * as MK from "@core/metrics/model/zio/metrics/MetricKey"
import * as T from "@effect/core/io/Effect"
import * as HMap from "@tsplus/stdlib/collections/HashMap"

import { pipe } from "@tsplus/stdlib/data/Function"

export const staticKeys : T.Effect<never, never, HMap.HashMap<string, MK.InsightKey>> = pipe(
  MK.metricKeysFromInsight(keysObj),
  T.map(keys => <[string, MK.InsightKey][]>(keys.map(k => [k.id, k]))),
  T.map(HMap.from),
  T.catchAll(_ => T.sync(() => HMap.empty<string, MK.InsightKey>()))
)

export const keyById = (id: string) => (keys: HMap.HashMap<string, MK.InsightKey>) =>
  HMap.get<string, MK.InsightKey>(id)(keys)

// A known counter id from state.json
export const counterId = "6e0c3c31-d51d-3dc3-b3a4-f65b3aab5e5a"
export const counterKey = pipe(
  staticKeys,
  T.map(keyById(counterId)),
  T.flatMap(T.getOrFail)
)

// A known gauge id from state.json
export const gaugeId = "7f29b1a9-cc39-3361-88ff-9cfad25b28cd"
export const gaugeKey = pipe(
  staticKeys,
  T.map(keyById(gaugeId)),
  T.flatMap(T.getOrFail)
)

// A known summary id from state.json
export const summaryId = "478bc349-a1b0-3e0a-a107-d3a0a820f4c8"
export const summaryKey = pipe(
  staticKeys,
  T.map(keyById(summaryId)),
  T.flatMap(T.getOrFail)
)

// A known frequency id from state.json
export const frequencyId = "14f12b03-adfd-305d-ba50-631fbdfdeb62"
export const frequencyKey = pipe(
  staticKeys,
  T.map(keyById(frequencyId)),
  T.flatMap(T.getOrFail)
)


// A known histogram id from state.json
export const histId = "e4697aca-cdca-301f-9a44-21c0f18f080e"
export const histKey = pipe(
  staticKeys,
  T.map(keyById(histId)),
  T.flatMap(T.getOrFail)
)

