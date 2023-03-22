import * as Ctx from "@effect/data/Context"
import { pipe } from "@effect/data/Function"
import * as C from "@effect/io/Clock"
import * as T from "@effect/io/Effect"
import * as L from "@effect/io/Layer"
import * as Ref from "@effect/io/Ref"

import { formatDate } from "@core/utils"

export interface LogLevel {
  name: string
  intLevel: number
}

export const Off: LogLevel = { name: "OFF", intLevel: 0 }
export const Fatal: LogLevel = { name: "FATAL", intLevel: 100 }
export const Error: LogLevel = { name: "ERROR", intLevel: 200 }
export const Info: LogLevel = { name: "INFO", intLevel: 400 }
export const Debug: LogLevel = { name: "DEBUG", intLevel: 500 }
export const Warn: LogLevel = { name: "WARN", intLevel: 300 }
export const Trace: LogLevel = { name: "TRACE", intLevel: 600 }
export const All: LogLevel = { name: "ALL", intLevel: 10000 }

export interface ConsoleService {
  readonly log: (msg: string) => T.Effect<never, never, void>
}

export const ConsoleService = Ctx.Tag<ConsoleService>()

export const ConsoleLive = L.effect(
  ConsoleService,
  T.sync(() => ({
    log: (msg: string) => T.sync(() => console.log(msg)),
  }))
)

export const ConsoleNull = L.effect(
  ConsoleService,
  T.sync(() => ({
    log: (_: string) =>
      T.sync(() => {
        /* ignore */
      }),
  }))
)

export interface LogService {
  readonly setLogLevel: (lvl: LogLevel) => T.Effect<never, never, void>
  readonly log: (lvl: LogLevel, msg: string) => T.Effect<never, never, void>
  readonly fatal: (msg: string) => T.Effect<never, never, void>
  readonly error: (msg: string) => T.Effect<never, never, void>
  readonly warn: (msg: string) => T.Effect<never, never, void>
  readonly info: (msg: string) => T.Effect<never, never, void>
  readonly debug: (msg: string) => T.Effect<never, never, void>
  readonly trace: (msg: string) => T.Effect<never, never, void>
}

export const LogService = Ctx.Tag<LogService>()

export const log = (lvl: LogLevel, msg: string) =>
  T.serviceWithEffect(LogService, (log: LogService) => log.log(lvl, msg))

export const fatal = (msg: string) => log(Fatal, msg)
export const error = (msg: string) => log(Error, msg)
export const warn = (msg: string) => log(Warn, msg)
export const info = (msg: string) => log(Info, msg)
export const debug = (msg: string) => log(Debug, msg)
export const trace = (msg: string) => log(Trace, msg)

function makeLogger(l: LogLevel) {
  return T.gen(function* ($) {
    const lvl = yield* $(Ref.make(() => l))
    const c = yield* $(T.service(ConsoleService))

    const now = pipe(
      C.currentTimeMillis(),
      T.map((now) => new Date(now))
    )

    const doLog = (logLvl: LogLevel, msg: string) =>
      T.ifEffect(
        pipe(
          Ref.get(lvl),
          T.map((l) => l().intLevel >= logLvl.intLevel)
        ),
        pipe(
          now,
          T.flatMap((d) => {
            return c.log(`[${logLvl.name.padEnd(5)}] -- [${formatDate(d)}] -- ${msg}`)
          })
        ),
        T.sync(() => {
          /* ignore */
        })
      )

    return {
      setLogLevel: (newLvl: LogLevel) => Ref.set(lvl, () => newLvl),
      log: (lvl: LogLevel, msg: string) => doLog(lvl, msg),
      fatal: (msg: string) => doLog(Fatal, msg),
      error: (msg: string) => doLog(Error, msg),
      warn: (msg: string) => doLog(Warn, msg),
      info: (msg: string) => doLog(Info, msg),
      debug: (msg: string) => doLog(Debug, msg),
      trace: (msg: string) => doLog(Trace, msg),
    } as LogService
  })
}

export const noop = L.effect(LogService, makeLogger(Off))
export const live = (l: LogLevel) => L.effect(LogService, makeLogger(l))
