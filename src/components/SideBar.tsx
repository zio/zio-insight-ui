import * as React from "react"
import { Link } from "react-router-dom"

export function SideBar() {
  return (
    <div className="h-full bg-red-300 px-2 flex flex-col">
      <Link to="/metrics">Metrics</Link>
      <Link to="/services">Services</Link>
      <Link to="/profiling">Profiling</Link>
      <Link to="/fibers">Fibers</Link>
      <Link to="/help">Help</Link>
      <Link to="/settings">Settings</Link>
    </div>
  )
}
