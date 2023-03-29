import * as Z from "zod"

import { fiberIdSchema, locationSchema } from "./FiberId"

const successSchema = Z.object({
  Succeeded: Z.object({
    endedAt: Z.number(),
  }),
})

const erroredSchema = Z.object({
  Errored: Z.object({
    endedAt: Z.number(),
    hint: Z.string(),
  }),
})

const suspendedSchema = Z.object({
  Suspended: Z.object({
    blockingOn: Z.array(fiberIdSchema),
    currentLocation: locationSchema,
  }),
})

const runningSchema = Z.object({
  Running: Z.object({
    currentLocation: locationSchema,
  }),
})

export const statusSchema = successSchema
  .or(erroredSchema)
  .or(suspendedSchema)
  .or(runningSchema)
