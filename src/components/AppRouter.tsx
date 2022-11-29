import * as React from "react"
import { Routes, Route } from "react-router-dom"
import { Fibers } from "@pages/Fibers"
import { Help } from "@pages/Help"
import { Dashboard } from "@pages/Dashboard"
import { Metrics } from "@pages/Metrics"
import { NotFound } from "@pages/NotFound"
import { Profiling } from "@pages/Profiling"
import { Services } from "@pages/Services"
import { Settings } from "@pages/Settings"
import { AppLayout } from "./AppLayout"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/services" element={<Services />} />
        <Route path="/profiling" element={<Profiling />} />
        <Route path="/fibers" element={<Fibers />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  )
}
