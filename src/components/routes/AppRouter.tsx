import { AppLayout } from "@components/layout/AppLayout"
import * as Pages from "@pages/Pages"
import * as React from "react"
import { Route, Routes } from "react-router-dom"

import { routes } from "./AppRoutes"

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<AppLayout />}>
        <Route index element={<Pages.Dashboard />} />
        {routes.map((route) => {
          return <Route path={route.path} element={route.component} />
        })}
        <Route path="*" element={<Pages.NotFound />} />
      </Route>
    </Routes>
  )
}
