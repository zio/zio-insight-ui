import * as T from "@effect/core/io/Effect"
import * as L from "@effect/core/io/Layer"
import { Tag } from "@tsplus/stdlib/service/Tag"

export interface LogService {
  readonly info: (msg: string) => T.Effect<never, never, void>
}

const LogServiceTag =Tag<LogService>()

export const consoleLogger : L.Layer<never, never, LogService> = 
  L.fromValue(LogServiceTag, () => ({
    info: (msg: string) => T.succeed(console.log(msg))
  }))

export const info = (msg: string) => 
  T.serviceWithEffect(LogServiceTag, log => log.info(msg))