import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import { pipe } from "@tsplus/stdlib/data/Function/pipe"
import { Tag } from "@tsplus/stdlib/service/Tag"

export interface ConsoleService {
  readonly log: (msg: string) => T.Effect<never, never, void>
}

export const ConsoleService = Tag<ConsoleService>()

export const ConsoleLive = L.fromEffect(ConsoleService)(
  T.sync(() => ({
    log: (msg : string) => T.sync(() => (console.log(msg) ))
  }))
)

export const ConsoleNull = L.fromEffect(ConsoleService)(
  T.sync(() => ({
    log: (_: string) => T.sync(() => {})
  }))
)

export interface LogService {
  readonly info: (msg: string) => T.Effect<never, never, void>
  readonly warn: (msg: string) => T.Effect<never, never, void>
  readonly error: (msg: string) => T.Effect<never, never, void>
  readonly debug: (msg: string) => T.Effect<never, never, void>
}

export const LogService =Tag<LogService>()

export const info = 
  (msg: string) => T.serviceWithEffect(LogService, log => log.info(msg))

export const warn = 
  (msg: string) => T.serviceWithEffect(LogService, log => log.warn(msg))

export const error = 
  (msg: string) => T.serviceWithEffect(LogService, log => log.error(msg))

export const debug = 
  (msg: string) => T.serviceWithEffect(LogService, log => log.debug(msg))

export const LoggerConsole = L.fromEffect(LogService)(
  T.gen(function*($){
    const { log } = yield* $(ConsoleService)
    return {
      info: (msg: string) => log(`[INFO ] -- ${msg}`),
      warn: (msg: string) => log(`[WARN ] -- ${msg}`),
      error: (msg: string) => log(`[ERROR] -- ${msg}`),
      debug: (msg: string) => log(`[DEBUG] -- ${msg}`)
    }
  })
)

export const LoggerLive = pipe(
  ConsoleLive,
  L.provideToAndMerge(LoggerConsole)
)