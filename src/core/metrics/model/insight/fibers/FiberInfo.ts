import * as T from "@effect/core/io/Effect"
import * as Z from "zod"

export const locationSchema = Z.object({
  location: Z.string(),
  file: Z.string(),
  line: Z.number()
})

export const fiberIdSchema = Z.object({
  id: Z.number(),
  startTimeMillis: Z.number(),
  location: locationSchema
})

export const fiberInfoSchema = Z.object({
  id: fiberIdSchema,
  parent: Z.nullable(fiberIdSchema),
  status: Z.unknown(),
  children: Z.array(fiberIdSchema)
})

export const fibersInfoSchema = Z.array(fiberInfoSchema)

export interface FiberInfo extends Z.TypeOf<typeof fiberInfoSchema> {}

export class InvalidFibers { 
  readonly _tag = "InvalidFibers"
  constructor(readonly reason: string) {}
}

export const fibersFromInsight : (value: unknown) => T.Effect<never, InvalidFibers, FiberInfo[]> = (value : unknown) =>
  T.gen(function* ($) {
    const parsed = fibersInfoSchema.safeParse(value)
    const states = parsed.success  
      ? yield* $(T.succeed(parsed.data))
      : yield* $(T.fail(new InvalidFibers(parsed.error.toString())))

    return states
  })