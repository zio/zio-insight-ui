import * as React from "react"
import { Outlet } from "react-router-dom"
import { NavBar } from "@components/NavBar"
import { SideBar } from "@components/SideBar"

export function AppLayout() {
  return (
    <div className="w-screen h-screen flex flex-col" data-theme="insight">
      <div className="flex flex-row h-full">
        <SideBar />
        <div className="flex flex-col w-full h-full">
          <NavBar />
          <div className="w-full flex h-full bg-base-100">
            <Outlet />
          </div>
        </div>
      </div>
    </div>
  )
}
