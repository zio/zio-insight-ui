import * as React from "react"
import * as AL from "@core/AppLayer"
import { AppRouter } from "./AppRouter"
import { IconContext } from "react-icons/lib"

// To connect to a real ZIO application we need to use
// AL.appLayerLive
const runtime = AL.unsafeMakeRuntime(AL.appLayerLive).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <IconContext.Provider
        value={{
          className: "text-neutral-content text-3xl mx-2"
        }}>
        <AppRouter />
      </IconContext.Provider>
    </RuntimeContext.Provider>
  )
}
