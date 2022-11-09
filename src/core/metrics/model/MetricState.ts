import * as T from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Z from 'zod'
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as Chunk from "@tsplus/stdlib/collections/Chunk"

import { MetricKey, metricKeySchema } from './MetricKey'

const gaugeStateSchema = Z.object({
  value: Z.number()
})

export interface GaugeState extends Z.TypeOf<typeof gaugeStateSchema> {}

const counterStateSchema = Z.object({
  count: Z.number()
})

export interface CounterState extends Z.TypeOf<typeof counterStateSchema> {}

const freqStateSchema = Z.object({
  occurrences: Z.unknown()
})

export interface FrequencyState extends Z.TypeOf<typeof freqStateSchema> {}

const summaryStateSchema = Z.object({
  error: Z.number(),
  count: Z.number(),
  min: Z.number(),
  max: Z.number(),
  sum: Z.number(),
  quantiles: Z.array(Z.tuple([Z.number(), Z.number()]))
})

export interface SummaryState extends Z.TypeOf<typeof summaryStateSchema> {}

const histStateSchema = Z.object({
  count: Z.number(),
  min: Z.number(),
  max: Z.number(),
  sum: Z.number(),
  buckets: Z.array(Z.tuple([Z.number(), Z.number()]))
})

export interface HistogramState extends Z.TypeOf<typeof histStateSchema> {}

export type MetricStateValue = GaugeState | CounterState | FrequencyState | SummaryState | HistogramState

// ZIO metrics connectors report the state with a type hint within the property key, so we can parse 
// the JSON with this schema
const combinedStateSchema = Z.object({
  Gauge: Z.optional(gaugeStateSchema),
  Counter: Z.optional(counterStateSchema),
  Summary: Z.optional(summaryStateSchema),
  Frequency: Z.optional(freqStateSchema),
  Histogram: Z.optional(histStateSchema)
})

interface CombinedState extends Z.TypeOf<typeof combinedStateSchema> {}

const rawMetricStateSchema = Z.object({
  id: Z.string(),
  key: metricKeySchema,
  state: combinedStateSchema,
  timestamp: Z.number()
})

const insightMetricStatesSchema = Z.object({
  states: Z.array(rawMetricStateSchema) 
})

export interface MetricState {
  id: string,
  key: MetricKey,
  state: MetricStateValue,
  timestamp: number
}
export class InvalidMetricStates {
  readonly _tag = "InvalidMetricStates"
  constructor(readonly reason: string) {}
}

// A helper function to unwrap the combined state we get from the Insight connector
const parseCurrentState : (_: CombinedState) => T.Effect<never, InvalidMetricStates, MetricStateValue> =  (comb: CombinedState) => {
  if (comb.Gauge !== undefined) { return T.succeed(comb.Gauge!) }
  else if (comb.Counter !== undefined) { return T.succeed(comb.Counter!) }
  else if (comb.Frequency !== undefined) { return T.succeed(comb.Frequency!) }
  else if (comb.Histogram !== undefined) { return T.succeed(comb.Histogram!) }
  else if (comb.Summary !== undefined) { return T.succeed(comb.Summary!) }
  else { return T.fail( new InvalidMetricStates(`Invalid metric state value <${JSON.stringify(comb)}>`)) } 
}


export const metricStatesFromInsight : (value: unknown) => T.Effect<never, InvalidMetricStates, MetricState[]> = (value: unknown) =>
  pipe(
    T.sync(() => insightMetricStatesSchema.safeParse(value)),
    T.flatMap((result) => 
    result.success 
      ? T.succeed(result.data.states)
      : T.fail(new InvalidMetricStates(result.error.toString()))
    ),
    T.flatMap( res => T.forEach(res, s => pipe(
      parseCurrentState(s.state),
      T.map(cs => <MetricState>{
        id : s.id,
        key: s.key,
        state: cs, 
        timestamp: s.timestamp
      })
    ))),
    T.map(res => Coll.toArray(Chunk.toCollection(res)))
  )