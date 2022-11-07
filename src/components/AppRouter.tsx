import * as React from "react"
import { Routes, Route } from "react-router-dom"
import { Fibers } from "./Fibers"
import { Help } from "./Help"
import { Home } from "./Home"
import { Metrics } from "./Metrics"
import { NotFound } from "./NotFound"
import { Profiling } from "./Profiling"
import { Services } from "./Services"
import { Settings } from "./Settings"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/metrics" element={<Metrics />} />
      <Route path="/services" element={<Services />} />
      <Route path="/profiling" element={<Profiling />} />
      <Route path="/fibers" element={<Fibers />} />
      <Route path="/help" element={<Help />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
