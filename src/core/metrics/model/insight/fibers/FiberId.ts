import type { Order } from "@effect/data/typeclass/Order"
import * as Z from "zod"

export const locationSchema = Z.tuple([Z.string(), Z.string(), Z.number()])

export interface Location extends Z.TypeOf<typeof locationSchema> {}

export const fiberIdSchema = Z.object({
  id: Z.number(),
  startTimeMillis: Z.number(),
  location: locationSchema,
})

export interface FiberId extends Z.TypeOf<typeof fiberIdSchema> {}

export const formatLocation = (loc: Location) => {
  if (loc[0].trim() == "" && loc[1].trim() == "" && loc[2] == 0) {
    return ""
  } else {
    return `${loc[0]}:(${loc[1]}:${loc[2]})`
  }
}

export const OrdFiberId = {
  compare: (x: FiberId, y: FiberId) => {
    if (x.id < y.id) return -1
    else if (x.id > y.id) return 1
    else return 0
  },
} as Order<FiberId>
