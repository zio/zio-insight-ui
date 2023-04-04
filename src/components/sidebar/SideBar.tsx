import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import { routes } from "@components/routes/AppRoutes"
import * as React from "react"
import { NavLink } from "react-router-dom"

export const SideBar: React.FC<{}> = (props) => {
  const drawer = useDrawerOpen()

  return (
    <div
      className={`${
        drawer.drawerOpenState ? "w-48" : "w-14"
      } flex flex-col bg-neutral text-neutral-content border-r`}
    >
      <div className="h-full flex flex-col">
        {routes.map((e) => (
          <NavLink
            key={e.path}
            data-tip={e.title}
            className={({ isActive }) => {
              return `py-2 text-xl font-extralight w-full flex flex-row border-b ${
                isActive ? "bg-accent" : "hover:bg-base-100"
              } ${
                drawer.drawerOpenState ? "" : "tooltip tooltip-right tooltip-secondary"
              }`
            }}
            to={e.path}
          >
            <div className="h-8 w-full flex flex-row justify-left">
              <span>{e.icon}</span>
              {drawer.drawerOpenState ? (
                <span className="flex self-center">{e.title}</span>
              ) : (
                <></>
              )}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
