import * as Z from "zod"

export const locationSchema = Z.tuple([Z.string(), Z.string(), Z.number()])

export const fiberIdSchema = Z.object({
  id: Z.number(),
  startTimeMillis: Z.number(),
  location: locationSchema,
})
