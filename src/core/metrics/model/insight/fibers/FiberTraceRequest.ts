import * as Zod from "zod"

const traceRequestSchema = Zod.object({
  root: Zod.optional(Zod.number()),
  activeOnly: Zod.boolean(),
  traced: Zod.array(Zod.number()),
})

export interface FiberTraceRequest extends Zod.TypeOf<typeof traceRequestSchema> {}

export const defaultTraceRequest: FiberTraceRequest = {
  activeOnly: false,
  traced: [],
}
