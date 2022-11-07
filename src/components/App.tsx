import * as React from "react"
import * as AL from "@core/layer"
import { AppRouter } from "./AppRouter"

const runtime = AL.unsafeMakeRuntime(AL.appLayer).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <AppRouter />
    </RuntimeContext.Provider>
  )
}
