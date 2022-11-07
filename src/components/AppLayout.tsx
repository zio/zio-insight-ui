import * as React from "react"
import { Outlet } from "react-router-dom"
import { NavBar } from "@components/NavBar"
import { SideBar } from "@components/SideBar"

export function AppLayout() {
  const [sideBar, setSideBar] = React.useState(true)

  const [theme, setTheme] = React.useState<string>("light")
  const toggleSideBar = () => setSideBar(!sideBar)
  const selectTheme = (t: string) => setTheme(t)

  return (
    <div className="w-screen h-screen flex flex-col" data-theme={theme}>
      <NavBar toggleSideBar={toggleSideBar} themeSelected={selectTheme} />
      <div className="w-full h-full flex ">
        <SideBar shown={sideBar} toggleSideBar={toggleSideBar} />
        <div className="w-full h-full flex bg-base-100">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
