import * as React from "react"
import * as AL from "@core/layer"
import { AppRouter } from "./AppRouter"
import { IconContext } from "react-icons/lib"

const runtime = AL.unsafeMakeRuntime(AL.appLayer).runtime
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
