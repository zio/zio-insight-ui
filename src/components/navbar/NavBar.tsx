import * as MUI from "@mui/material"
import Logo from "@static/ZIO.png"
import * as React from "react"
import * as FaIcons from "react-icons/fa"

interface NavBarProps {
  onMenuClick: () => void
}

export const NavBar: React.FC<NavBarProps> = () => {
  const ghButton = (
    <span className="flex-none btn btn-ghost">
      <FaIcons.FaGithub />
    </span>
  )

  const logo = (
    <>
      <img src={Logo} alt="" />
      <li className="flex-none">
        <span>Insight</span>
      </li>
    </>
  )

  return (
    <MUI.AppBar position="fixed">
      <MUI.Toolbar></MUI.Toolbar>
    </MUI.AppBar>
    // <div className="flex flex-row flex-none navbar bg-neutral w-full text-neutral-content text-2xl border-b-2">
    //   {logo}
    //   <span className="flex-grow" />
    //   {ghButton}
    // </div>
  )
}
