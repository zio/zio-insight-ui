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

const AvailableMetrics = Z.object({
  keys: Z.array(metricKeySchema)
})

export class InvalidMetricKeys {
  readonly _tag = "InvalidMetricKeys"
  constructor(readonly reason: string) {}
}

export const fromInsight : (value: unknown) => T.Effect<never, InvalidMetricKeys, MetricKey[]> = (value : unknown) => 
  pipe(
    T.sync(() => AvailableMetrics.safeParse(value)),
    T.flatMap((result) => 
      result.success 
        ? T.succeed(result.data.keys)
        : T.fail(new InvalidMetricKeys(result.error.toString()))
    )
  )

