import * as Z from "zod"

export const gaugeTypeSchema = Z.literal("Gauge")
export const cntTypeSchema = Z.literal("Counter")
export const freqTypeSchema = Z.literal("Frequency")
export const histTypeSchema = Z.literal("Histogram")
export const summTypeSchema = Z.literal("Summary")

export const metricTypeSchema = gaugeTypeSchema.or(cntTypeSchema).or(freqTypeSchema).or(histTypeSchema).or(summTypeSchema)

export type MetricType = Z.infer<typeof metricTypeSchema>
