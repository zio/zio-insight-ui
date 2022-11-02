import * as T from '@effect/core/io/Effect'
import { Chunk } from '@tsplus/stdlib/collections/Chunk'
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

const metricKeySchema = Z.tuple([
  Z.string(),
  Z.array(metricLabelSchema),
  metricTypeSchema,
  Z.string()
])

interface RawMetricKey extends Z.TypeOf<typeof metricKeySchema> {}

export interface MetricKey {
  name: string,
  labels: MetricLabel[],
  metricType: MetricType,
  details: unknown
}

export const keyAsString = (mk: MetricKey) => 
  `${mk.metricType}:${mk.name}:${mk.labels.map(l => l.key + "=" + l.value).join(',')}`

const AvailableMetrics = Z.object({
  keys: Z.array(metricKeySchema)
})

export class InvalidMetricKeys {
  readonly _tag = "InvalidMetricKeys"
  constructor(readonly reason: string) {}
}

export const fromInsight : (value: unknown) => T.Effect<never, InvalidMetricKeys, Chunk<MetricKey>> = (value : unknown) => 
  pipe(
    T.sync(() => AvailableMetrics.safeParse(value)),
    T.flatMap((result) => 
      result.success 
        ? T.succeed(result.data.keys)
        : T.fail(new InvalidMetricKeys(result.error.toString()))
    ),
    T.flatMap((rawKeys) => 
      T.forEach(rawKeys, k => T.succeed(fromRawKey(k)))
    )
  )

const fromRawKey : (raw: RawMetricKey) => MetricKey = (raw: RawMetricKey) => {
  return {
    name : raw[0],
    labels: raw[1],
    metricType: raw[2],
    details: JSON.parse(raw[3])
  }
}
