import type * as C from "@effect/data/Chunk"
import { pipe } from "@effect/data/Function"
import * as HMap from "@effect/data/HashMap"
import * as Clk from "@effect/io/Clock"
import * as T from "@effect/io/Effect"
import * as Z from "zod"

import type { InsightKey, MetricKey } from "./MetricKey"
import { metricKeySchema } from "./MetricKey"

const gaugeStateSchema = Z.object({
  value: Z.number(),
})

export interface GaugeState extends Z.TypeOf<typeof gaugeStateSchema> {}

const counterStateSchema = Z.object({
  count: Z.number(),
})

export interface CounterState extends Z.TypeOf<typeof counterStateSchema> {}

const freqStateSchema = Z.object({
  occurrences: Z.unknown(),
})

export interface FrequencyState {
  occurrences: HMap.HashMap<string, number>
}

const summaryStateSchema = Z.object({
  error: Z.number(),
  count: Z.number(),
  min: Z.number(),
  max: Z.number(),
  sum: Z.number(),
  quantiles: Z.array(Z.tuple([Z.number(), Z.number()])),
})

export interface SummaryState extends Z.TypeOf<typeof summaryStateSchema> {}

const histStateSchema = Z.object({
  count: Z.number(),
  min: Z.number(),
  max: Z.number(),
  sum: Z.number(),
  buckets: Z.array(Z.tuple([Z.number(), Z.number()])),
})

export interface HistogramState extends Z.TypeOf<typeof histStateSchema> {}

export type MetricStateValue =
  | GaugeState
  | CounterState
  | FrequencyState
  | SummaryState
  | HistogramState

// ZIO metrics connectors report the state with a type hint within the property key, so we can parse
// the JSON with this schema
const combinedStateSchema = Z.object({
  Gauge: Z.optional(gaugeStateSchema),
  Counter: Z.optional(counterStateSchema),
  Summary: Z.optional(summaryStateSchema),
  Frequency: Z.optional(freqStateSchema),
  Histogram: Z.optional(histStateSchema),
})

interface CombinedState extends Z.TypeOf<typeof combinedStateSchema> {}

const rawMetricStateSchema = Z.object({
  id: Z.string(),
  key: metricKeySchema,
  state: combinedStateSchema,
  timestamp: Z.number(),
})

const insightMetricStatesSchema = Z.object({
  states: Z.array(rawMetricStateSchema),
})

export class MetricState {
  readonly id: string
  readonly key: MetricKey
  readonly state: MetricStateValue
  readonly lastChange: Date
  readonly retrieved: Date

  constructor(
    id: string,
    key: MetricKey,
    state: MetricStateValue,
    lastChange: Date,
    retrieved: Date
  ) {
    this.id = id
    this.key = key
    this.state = state
    this.lastChange = lastChange
    this.retrieved = retrieved
  }

  insightKey() {
    return {
      id: this.id,
      key: this.key,
    } as InsightKey
  }
}

export class InvalidMetricStates {
  readonly _tag = "InvalidMetricStates"
  constructor(readonly reason: string) {}
}

const parseFrequency = (state: unknown) => {
  const res: [string, number][] = []

  const freqs: any = state ? state : {}

  Object.keys(freqs).forEach((k) => {
    const v: string = (freqs as any)[k]
    if (typeof v === "number") {
      res.push([k, v])
    }
  })

  return {
    occurrences: HMap.make(...res),
  } as FrequencyState
}

// A helper function to unwrap the combined state we get from the Insight connector
const parseCurrentState: (
  _: CombinedState
) => T.Effect<never, InvalidMetricStates, MetricStateValue> = (comb: CombinedState) => {
  const g = comb.Gauge
  if (g) {
    return T.succeed(g)
  }

  const c = comb.Counter
  if (c) {
    return T.succeed(c)
  }

  const f = comb.Frequency
  if (f) {
    const occurrences = f.occurrences
    const state = occurrences
      ? parseFrequency(occurrences)
      : parseFrequency({ occurrences: {} })
    return T.succeed(state)
  }

  const h = comb.Histogram
  if (h) {
    return T.succeed(h)
  }

  const s = comb.Summary
  if (s) {
    return T.succeed(s)
  }

  return T.fail(
    new InvalidMetricStates(`Invalid metric state value <${JSON.stringify(comb)}>`)
  )
}

export const metricStatesFromInsight: (
  value: unknown
) => T.Effect<never, InvalidMetricStates, C.Chunk<MetricState>> = (value: unknown) =>
  T.gen(function* ($) {
    const parsed = insightMetricStatesSchema.safeParse(value),
      states = parsed.success
        ? parsed.data.states
        : yield* $(
            T.fail(
              new InvalidMetricStates(
                `${parsed.error.toString()}\n${JSON.stringify(value, null, 2)}`
              )
            )
          )
    const now = yield* $(
      pipe(
        Clk.currentTimeMillis(),
        T.map((t) => new Date(t))
      )
    )
    const res = yield* $(
      T.forEach(states, (s) =>
        pipe(
          parseCurrentState(s.state),
          T.map((cs) => {
            return new MetricState(s.id, s.key, cs, new Date(s.timestamp), now)
          })
        )
      )
    )

    return res
  })
