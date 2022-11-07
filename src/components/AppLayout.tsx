import * as React from "react"
import { Outlet } from "react-router-dom"
import { NavBar } from "@components/NavBar"
import { SideBar } from "@components/SideBar"

export function AppLayout() {
  return (
    <div className="w-screen h-screen flex flex-col" data-theme="light">
      <NavBar />
      <div className="w-full h-full flex flex-row">
        <SideBar />
        <div className="w-full h-full flex flex-grow">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
