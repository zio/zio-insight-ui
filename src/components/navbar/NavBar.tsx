import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material"
import { styled } from "@mui/system"
import Logo from "@static/ZIO.png"
import * as React from "react"
import * as FaIcons from "react-icons/fa"

interface NavBarProps {
  onMenuClick: () => void
}

const StyledTitle = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
}))

export const NavBar: React.FC<NavBarProps> = (props) => {
  return (
    <>
      <AppBar position="fixed">
        <Toolbar>
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
    </>
  )
}
