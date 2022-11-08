import * as T from '@effect/core/io/Effect'
import { pipe } from '@tsplus/stdlib/data/Function'
import * as Z from 'zod'

const metricLabelSchema = Z.object({
  key: Z.string(),
  value: Z.string()
})

export interface MetricLabel extends Z.TypeOf<typeof metricLabelSchema> {}

const metricTypeSchema = Z.enum(
  ["Counter", "Gauge", "Frequency", "Histogram", "Summary"]
)

export type MetricType = Z.infer<typeof metricTypeSchema>

const metricKeySchema = Z.object({
  id: Z.string(),
  key: Z.object({
    name: Z.string(),
    labels: Z.array(metricLabelSchema),
    metricType: metricTypeSchema
  })
})

export interface MetricKey extends Z.TypeOf<typeof metricKeySchema> {}

export const keyAsString = (mk: MetricKey) => 
  `${mk.key.metricType}:${mk.key.name}:${mk.key.labels.map(l => l.key + "=" + l.value).join(',')}`

const InsightMetricKeys = Z.object({
  keys: Z.array(metricKeySchema)
})

export class InvalidMetricKeys {
  readonly _tag = "InvalidMetricKeys"
  constructor(readonly reason: string) {}
}

export const metricKeysFromInsight : (value: unknown) => T.Effect<never, InvalidMetricKeys, MetricKey[]> = (value : unknown) => 
  pipe(
    T.sync(() => InsightMetricKeys.safeParse(value)),
    T.flatMap((result) => 
      result.success 
        ? T.succeed(result.data.keys)
        : T.fail(new InvalidMetricKeys(result.error.toString()))
    )
  )

const metricStateSchema = Z.object({
  id: Z.string()
})

const InsightMetricStates = Z.object({
  states: Z.array(metricStateSchema) 
})

export interface MetricState extends Z.TypeOf<typeof metricStateSchema>{}

export class InvalidMetricStates {
  readonly _tag = "InvalidMetricStates"
  constructor(readonly reason: string) {}
}

export const metricStatesFromInsight : (value: unknown) => T.Effect<never, InvalidMetricStates, MetricState[]> = (value: unknown) =>
  pipe(
    T.sync(() => InsightMetricStates.safeParse(value)),
    T.flatMap((result) => 
    result.success 
      ? T.succeed(result.data.states)
      : T.fail(new InvalidMetricStates(result.error.toString()))
    )
  ) 