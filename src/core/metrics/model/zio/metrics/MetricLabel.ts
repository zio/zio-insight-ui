import * as Z from "zod"

export const metricLabelSchema = Z.object({
  key: Z.string(),
  value: Z.string()
})

export interface MetricLabel extends Z.TypeOf<typeof metricLabelSchema> {}
