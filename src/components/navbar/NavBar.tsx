import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material"
import { styled } from "@mui/system"
import Logo from "@static/ZIO.png"
import * as React from "react"
import * as FaIcons from "react-icons/fa"
import * as MdIcons from "react-icons/md"

interface NavBarProps {
  onMenuClick: () => void
}

const StyledTitle = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
}))

export const NavBar: React.FC<NavBarProps> = (props) => (
  <AppBar position="fixed">
    <Toolbar>
      <IconButton
        edge="start"
        color="inherit"
        aria-label="menu"
        onClick={props.onMenuClick}
      >
        <MdIcons.MdMenu />
      </IconButton>
      <img src={Logo} alt="" />
      <StyledTitle>Insight</StyledTitle>
      <Box>
        <IconButton
          edge="end"
          color="inherit"
          aria-label="GitHub Repository"
          href="https://github.com/zio/zio-insight-ui"
          target="_blank"
        >
          <FaIcons.FaGithub />
        </IconButton>
      </Box>
    </Toolbar>
  </AppBar>
)

export const StyledNavBar = styled(NavBar)(({ theme }) => ({
  "& .navbar-title": {
    color: "green",
    flexGrow: 1,
  },
}))
