import * as React from "react"
import { NavLink } from "react-router-dom"
import * as VscIcons from "react-icons/vsc"
import * as AiIcons from "react-icons/ai"
import * as MdIcons from "react-icons/md"
import * as BsIcons from "react-icons/bs"
import * as GiIcons from "react-icons/gi"
import * as FaIcons from "react-icons/fa"

interface NavEntry {
  title: string
  path: string
  icon: React.ReactElement
}

const entries: NavEntry[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: <VscIcons.VscGraphLine />
  },
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

export const SideBar: React.FC<{}> = (props) => {
  const [shown, setShown] = React.useState<boolean>(true)
  const toggleShown = () => setShown(!shown)

  const btnStyle = "p-2 bg-primary text-4xl rounded-full"

  const collapseBtn = (
    <div className="flex flex-row absolute top-[12px] right-[-24px]">
      {shown ? (
        <FaIcons.FaAngleLeft className={btnStyle} onClick={toggleShown} />
      ) : (
        <FaIcons.FaAngleRight className={btnStyle} onClick={toggleShown} />
      )}
    </div>
  )

  return (
    <div
      className={`${
        shown ? "w-48" : "w-14"
      } flex flex-col bg-neutral text-neutral-content border-r`}>
      <div className="h-[70px] border-b-2 relative">{collapseBtn}</div>
      <div className="h-full flex flex-col">
        {entries.map((e) => (
          <NavLink
            key={e.path}
            data-tip={e.title}
            className={({ isActive }) => {
              return `py-2 text-2xl font-extralight w-full flex flex-row border-b ${
                isActive ? "bg-accent" : "hover:bg-base-100"
              } ${shown ? "" : "tooltip tooltip-right tooltip-secondary"}`
            }}
            to={e.path}>
            <div className="h-8 w-full flex flex-row justify-left">
              <span>{e.icon}</span>
              {shown ? <span className="flex self-center">{e.title}</span> : <></>}
            </div>
          </NavLink>
        ))}
      </div>
    </div>
  )
}
