import * as React from "react"
import { IconContext } from "react-icons/lib"

import * as AL from "@core/AppLayer"

import { AppRouter } from "./AppRouter"

// To connect to a real ZIO application we need to use
// AL.appLayerLive
const runtime = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <IconContext.Provider
        value={{
          className: "text-neutral-content text-3xl mx-2",
        }}
      >
        <AppRouter />
      </IconContext.Provider>
    </RuntimeContext.Provider>
  )
}
