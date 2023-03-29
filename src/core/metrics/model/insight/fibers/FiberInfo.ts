import * as T from "@effect/io/Effect"
import * as Z from "zod"

import { fiberIdSchema } from "./FiberId"
import { statusSchema } from "./FiberStatus"

export const fiberInfoSchema = Z.object({
  id: fiberIdSchema,
  parent: Z.optional(fiberIdSchema),
  status: statusSchema,
})

export const fibersInfoSchema = Z.array(fiberInfoSchema)

export interface FiberInfo extends Z.TypeOf<typeof fiberInfoSchema> {}

export class InvalidFibers {
  readonly _tag = "InvalidFibers"
  constructor(readonly reason: string) {}
}

export const fibersFromInsight: (
  value: unknown
) => T.Effect<never, InvalidFibers, FiberInfo[]> = (value: unknown) =>
  T.gen(function* ($) {
    const parsed = fibersInfoSchema.safeParse(value)
    const states = parsed.success
      ? yield* $(T.succeed(parsed.data))
      : yield* $(T.fail(new InvalidFibers(parsed.error.toString())))

    return states
  })
