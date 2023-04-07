import * as Pages from "@pages/Pages"
import * as React from "react"
import * as AiIcons from "react-icons/ai"
import * as BsIcons from "react-icons/bs"
import * as GiIcons from "react-icons/gi"
import * as MdIcons from "react-icons/md"
import * as VscIcons from "react-icons/vsc"

export type Route = {
  path: string
  title: string
  component: React.ReactElement
  icon: React.ReactElement
}

export const routes: Route[] = [
  {
    title: "Dashboard",
    path: "/",
    icon: <VscIcons.VscGraphLine />,
    component: <Pages.Dashboard />,
  },
  {
    title: "Metrics",
    path: "/metrics",
    icon: <VscIcons.VscGraphLine />,
    component: <Pages.Metrics />,
  },
  {
    title: "Services",
    path: "/services",
    icon: <AiIcons.AiOutlinePartition />,
    component: <Pages.Services />,
  },
  {
    title: "Profiling",
    path: "/profiling",
    icon: <BsIcons.BsSpeedometer2 />,
    component: <Pages.Profiling />,
  },
  {
    title: "Fibers",
    path: "/fibers",
    icon: <GiIcons.GiFamilyTree />,
    component: <Pages.Fibers />,
  },
  {
    title: "Help",
    path: "/help",
    icon: <MdIcons.MdOutlineLiveHelp />,
    component: <Pages.Help />,
  },
  {
    title: "Settings",
    path: "/settings",
    icon: <VscIcons.VscSettings />,
    component: <Pages.Settings />,
  },
]
