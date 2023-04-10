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

export class InvalidFibers {
  readonly _tag = "InvalidFibers"
  constructor(readonly reason: string) {}
}

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
