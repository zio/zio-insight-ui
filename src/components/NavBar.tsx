import * as React from "react"
import { Link } from "react-router-dom"

export function NavBar() {
  return (
    <nav className="navbar">
      <ul>
        <li>
          <Link to="/">Insight</Link>
        </li>
      </ul>
    </nav>
  )
}
