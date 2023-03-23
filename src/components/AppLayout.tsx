import { NavBar } from "@components/NavBar"
import { SideBar } from "@components/SideBar"
import * as React from "react"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <div className="w-screen h-screen flex flex-col" data-theme="insight">
      <div className="flex flex-row h-full">
        <SideBar />
        <div className="flex flex-col justify-items stretch w-full h-full">
          <NavBar />
          <div className="grow bg-base-100">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
