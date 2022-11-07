import * as React from "react"
import * as AL from "@core/layer"
import { NavBar } from "./NavBar"
import { SideBar } from "./SideBar"
import { AppRouter } from "./AppRouter"

const runtime = AL.unsafeMakeRuntime(AL.appLayer).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <div
        data-theme="light"
        className="w-screen h-screen p-2 flex flex-col overflow-hidden">
        <NavBar />
        <div className="flex flex-row w-full h-full">
          <SideBar />
          <AppRouter />
        </div>
      </div>
    </RuntimeContext.Provider>
  )
}
