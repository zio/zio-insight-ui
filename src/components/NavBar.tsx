import * as React from "react"
import { Link } from "react-router-dom"
import * as FaIcons from "react-icons/fa"
import Logo from "@static/ZIO.png"

export const NavBar: React.FC<{ toggleSideBar: () => void }> = (props) => {
  return (
    <nav className="navbar bg-neutral w-full">
      <ul className="w-full flex flex-row content-center">
        <li className="flex flex-none">
          <Link to="#" onClick={props.toggleSideBar}>
            <FaIcons.FaBars />
          </Link>
        </li>
        <img src={Logo} alt="" />
        <li className="flex flex-none">
          <Link to="/">
            <span className="text-neutral-content text-xl">Insight</span>
          </Link>
        </li>
        <span className="flex flex-grow" />
        <li className="flex flex-none">
          <Link to="#">
            <FaIcons.FaGithub />
          </Link>
        </li>
      </ul>
    </nav>
  )
}
