import type { Order } from "@effect/data/typeclass/Order"
import * as dateFns from "date-fns"
import * as Z from "zod"

export const locationSchema = Z.tuple([Z.string(), Z.string(), Z.number()])

export interface Location extends Z.TypeOf<typeof locationSchema> {}

export const fiberIdSchema = Z.object({
  id: Z.number(),
  startTimeMillis: Z.number(),
  location: locationSchema,
})

export interface FiberId extends Z.TypeOf<typeof fiberIdSchema> {}

export const formatLocation = (location: Location) => {
  if (location[0].trim() == "" && location[1].trim() == "" && location[2] == 0) {
    return ""
  } else {
    return `${location[0]}:(${location[1]}:${location[2]})`
  }
}

export const formatDate = (id: FiberId) => {
  const d = new Date(id.startTimeMillis)
  return dateFns.format(d, "yyyy-MM-dd HH:mm:ss")
}

export const OrdFiberId = {
  compare: (x: FiberId, y: FiberId) => {
    if (x.id < y.id) return -1
    else if (x.id > y.id) return 1
    else return 0
  },
} as Order<FiberId>
