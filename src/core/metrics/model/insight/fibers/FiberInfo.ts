import * as Effect from "@effect/io/Effect"
import * as Zod from "zod"

import * as FiberId from "./FiberId"
import { statusSchema } from "./FiberStatus"

export const fiberInfoSchema = Zod.object({
  id: FiberId.fiberIdSchema,
  parent: Zod.optional(FiberId.fiberIdSchema),
  status: statusSchema,
  trace: Zod.optional(Zod.array(FiberId.locationSchema)),
})

export const fibersInfoSchema = Zod.array(fiberInfoSchema)

export interface FiberInfo extends Zod.TypeOf<typeof fiberInfoSchema> {}

const activeStates = ["Root", "Suspended", "Running"]
const inactiveStates = ["Succeeded", "Errored"]
export const FiberStates = (() => {
  const res = activeStates.slice()
  res.push(...inactiveStates)
  return res
})()

export const stateAsString = (f: FiberInfo) => {
  const keys = Object.keys(f.status)
  return keys.length > 0 ? keys[0] : "Unknown"
}

export const isActive = (f: FiberInfo) =>
  activeStates.find((s) => s == stateAsString(f)) != undefined

export class InvalidFibers {
  readonly _tag = "InvalidFibers"
  constructor(readonly reason: string) {}
}

export const fiberFromInsight: (
  value: unknown
) => Effect.Effect<never, InvalidFibers, FiberInfo> = (value: unknown) =>
  Effect.gen(function* ($) {
    const parsed = fiberInfoSchema.safeParse(value)
    const states = parsed.success
      ? yield* $(Effect.succeed(parsed.data))
      : yield* $(Effect.fail(new InvalidFibers(parsed.error.toString())))

    return states
  })

export const fibersFromInsight: (
  value: unknown
) => Effect.Effect<never, InvalidFibers, FiberInfo[]> = (value: unknown) =>
  Effect.gen(function* ($) {
    const parsed = fibersInfoSchema.safeParse(value)
    const states = parsed.success
      ? yield* $(Effect.succeed(parsed.data))
      : yield* $(Effect.fail(new InvalidFibers(parsed.error.toString())))

    return states
  })
