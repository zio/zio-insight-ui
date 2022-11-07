import * as React from "react"
import { Link, Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <>
      <Link to="/metrics">Metrics</Link>
      <Outlet />
    </>
  )
}
