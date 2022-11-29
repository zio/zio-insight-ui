import * as React from "react"
import * as FaIcons from "react-icons/fa"
import Logo from "@static/ZIO.png"

export const NavBar: React.FC<{}> = () => {
  const ghButton = (
    <span className="flex-none btn btn-ghost">
      <FaIcons.FaGithub />
    </span>
  )

  const logo = (
    <>
      <img src={Logo} alt="" />
      <li className="flex flex-none">
        <span>Insight</span>
      </li>
    </>
  )

  return (
    <div className="navbar bg-neutral w-full text-neutral-content text-2xl border-b-2">
      {logo}
      <span className="flex flex-grow" />
      {/* <div className="flex-none">{themeMenu}</div> */}
      {ghButton}
    </div>
  )
}
