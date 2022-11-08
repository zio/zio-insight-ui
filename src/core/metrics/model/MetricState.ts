import * as T from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Z from 'zod'

import { metricKeySchema } from './MetricKey'

const stateValueSchema = Z.object({
  Gauge: Z.optional(Z.object({
    value: Z.number()
  })),
  Counter: Z.optional(Z.object({
    count: Z.number()
  })),
  Summary: Z.optional(Z.object({
    error: Z.number(),
    count: Z.number(),
    min: Z.number(),
    max: Z.number(),
    sum: Z.number(),
    quantiles: Z.array(Z.tuple([Z.number(), Z.number()]))
  })),
  Frequency: Z.optional(Z.object({
    occurrences: Z.unknown()
  })),
  Histogram: Z.optional(Z.object({
    count: Z.number(),
    min: Z.number(),
    max: Z.number(),
    sum: Z.number(),
    buckets: Z.array(Z.tuple([Z.number(), Z.number()]))
  }))
})

const rawMetricStateSchema = Z.object({
  id: Z.string(),
  key: metricKeySchema,
  state: stateValueSchema,
  timestamp: Z.number()
})

const insightMetricStatesSchema = Z.object({
  states: Z.array(rawMetricStateSchema) 
})

interface InsightMetricStates extends Z.TypeOf<typeof insightMetricStatesSchema> {}

export interface MetricState extends Z.TypeOf<typeof rawMetricStateSchema>{}

export class InvalidMetricStates {
  readonly _tag = "InvalidMetricStates"
  constructor(readonly reason: string) {}
}

const parseCurrentState = (value: unknown) => {
  const xx = <any>value
  if (xx["Gauge"] !== undefined) {
    return T.succeed(xx["Gauge"])
  } else {
    return T.succeed({})
  }
}


export const metricStatesFromInsight : (value: unknown) => T.Effect<never, InvalidMetricStates, MetricState[]> = (value: unknown) =>
  pipe(
    T.sync(() => insightMetricStatesSchema.safeParse(value)),
    T.flatMap((result) => 
    result.success 
      ? T.succeed(result.data.states)
      : T.fail(new InvalidMetricStates(result.error.toString()))
    )
  )