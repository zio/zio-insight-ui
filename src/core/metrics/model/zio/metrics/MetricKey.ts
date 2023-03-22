import { pipe } from "@effect/data/Function"
import type { Order } from "@effect/data/typeclass/Order"
import * as T from "@effect/io/Effect"
import * as Z from "zod"

import { metricLabelSchema } from "./MetricLabel"
import { metricTypeSchema } from "./MetricType"

// The metric key data as it comes from ZIO metrics connectors
export const metricKeySchema = Z.object({
  name: Z.string(),
  labels: Z.array(metricLabelSchema),
  metricType: metricTypeSchema,
})

export interface MetricKey extends Z.TypeOf<typeof metricKeySchema> {}

// The insight connectors adds a unique id that is used to query the state of the
// corresponding metricKey
export const insightKeySchema = Z.object({
  id: Z.string(),
  key: metricKeySchema,
})

export interface InsightKey extends Z.TypeOf<typeof insightKeySchema> {}

export const OrdInsightKey = {
  compare: (x: InsightKey, y: InsightKey) => {
    if (x.id < y.id) return -1
    else if (x.id > y.id) return 1
    else return 0
  },
} as Order<InsightKey>

export const keyAsString = (mk: MetricKey) =>
  `${mk.metricType}:${mk.name}:${mk.labels.map((l) => l.key + "=" + l.value).join(",")}`

export const InsightMetricKeys = Z.object({
  keys: Z.array(insightKeySchema),
})

export class InvalidMetricKeys {
  readonly _tag = "InvalidMetricKeys"
  constructor(readonly reason: string) {}
}

export const metricKeysFromInsight: (
  value: unknown
) => T.Effect<never, InvalidMetricKeys, InsightKey[]> = (value: unknown) =>
  pipe(
    T.sync(() => InsightMetricKeys.safeParse(value)),
    T.flatMap((result) =>
      result.success
        ? T.succeed(result.data.keys)
        : T.fail(new InvalidMetricKeys(result.error.toString()))
    )
  )
