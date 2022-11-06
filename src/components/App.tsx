import * as React from "react"
import * as AL from "@core/layer"
import { MetricKeySelector } from "./TableMetricKey"

const runtime = AL.unsafeMakeRuntime(AL.appLayer).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <div className="w-screen h-screen" data-theme="dark">
        <MetricKeySelector />
      </div>
    </RuntimeContext.Provider>
  )
}
