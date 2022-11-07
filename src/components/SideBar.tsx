import * as React from "react"
import { NavLink } from "react-router-dom"
import * as VscIcons from "react-icons/vsc"
import * as AiIcons from "react-icons/ai"
import * as MdIcons from "react-icons/md"
import * as BsIcons from "react-icons/bs"
import * as GiIcons from "react-icons/gi"

interface NavEntry {
  title: string
  path: string
  icon: React.ReactElement
}

const entries: NavEntry[] = [
  {
    title: "Metrics",
    path: "/metrics",
    icon: <VscIcons.VscGraphLine />
  },
  {
    title: "Services",
    path: "/services",
    icon: <AiIcons.AiOutlinePartition />
  },
  {
    title: "Profiling",
    path: "/profiling",
    icon: <BsIcons.BsSpeedometer2 />
  },
  {
    title: "Fibers",
    path: "/fibers",
    icon: <GiIcons.GiFamilyTree />
  },
  {
    title: "Help",
    path: "/help",
    icon: <MdIcons.MdOutlineLiveHelp />
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <VscIcons.VscSettings />
  }
]

export const SideBar: React.FC<{ shown: boolean; toggleSideBar: () => void }> = (
  props
) => {
  //  if (props.shown) {
  return (
    <div className="pt-2 bg-neutral text-neutral-content h-full px-4 flex flex-col">
      {entries.map((e) => (
        <NavLink
          key={e.path}
          className={({ isActive }) => {
            return `w-full flex flex-row btn ${isActive ? "btn-accent" : "btn-ghost"}`
          }}
          to={e.path}
          onClick={props.toggleSideBar}>
          <div className="w-full flex flex-row justify-between">
            <span>{e.icon}</span>
            <span className="flex self-center">{e.title}</span>
          </div>
        </NavLink>
      ))}
    </div>
  )
  // } else {
  //   return null
  // }
}
