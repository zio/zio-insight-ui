import * as React from "react"
import { NavLink } from "react-router-dom"

const NavButton: React.FC<{ title: String }> = (props) => {
  return (
    <NavLink
      className={({ isActive }) => {
        return `btn ${isActive ? "bg-blue-300" : "btn-ghost"}`
      }}
      to={`/${props.title.toLowerCase()}`}>
      {props.title}
    </NavLink>
  )
}

const links = ["Metrics", "Services", "Profiling", "Fibers", "Help", "Settings"]

export function SideBar() {
  return (
    <div className="h-full px-2 flex flex-col">
      {links.map((l) => (
        <NavButton key={l} title={l} />
      ))}
    </div>
  )
}
