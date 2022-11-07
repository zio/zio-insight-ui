import * as React from "react"
import { Link } from "react-router-dom"
import * as FaIcons from "react-icons/fa"
import Logo from "@static/ZIO.png"

interface Theme {
  id: string
  displayName: string
}

export const NavBar: React.FC<{
  toggleSideBar: () => void
  themeSelected: (_: string) => void
}> = (props) => {
  const themes: Theme[] = [
    {
      id: "light",
      displayName: "Light"
    },
    {
      id: "dark",
      displayName: "Dark"
    },
    {
      id: "lemonade",
      displayName: "Lemonade"
    },
    {
      id: "corporate",
      displayName: "Corporate"
    }
  ]

  const themeMenu = (
    <div className="dropdown dropdown-end">
      <a tabIndex={0} className="btn btn-ghost flex flex-row">
        Themes
        <FaIcons.FaCaretDown />
      </a>
      <div tabIndex={0} className="p-2 shadow dropdown-content bg-neutral">
        {themes.map((t) => (
          <div key={t.id}>
            <div
              className="btn btn-ghost w-full"
              onClick={() => props.themeSelected(t.id)}>
              {t.displayName}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ghButton = (
    <span className="flex-none btn btn-ghost">
      <FaIcons.FaGithub />
    </span>
  )

  const logo = (
    <>
      <img src={Logo} alt="" />
      <li className="flex flex-none">
        <Link to="/">Insight</Link>
      </li>
    </>
  )

  const sidebarToggle = (
    <div className="flex-none btn btn-ghost" onClick={props.toggleSideBar}>
      <FaIcons.FaBars />
    </div>
  )

  return (
    <div className="navbar bg-neutral w-full text-neutral-content text-2xl">
      {sidebarToggle}
      {logo}
      <span className="flex flex-grow" />
      <div className="flex-none">{themeMenu}</div>
      {ghButton}
    </div>
  )
}
