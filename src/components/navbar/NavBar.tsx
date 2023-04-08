import { AppBar, Box, IconButton, Toolbar, Typography } from "@mui/material"
import type { AppBarProps, Mixins, Transitions, ZIndex } from "@mui/material"
import { styled } from "@mui/system"
import Logo from "@static/ZIO.png"
import * as React from "react"
import * as FaIcons from "react-icons/fa"
import * as MdIcons from "react-icons/md"

import { useInsightTheme } from "../theme/InsightTheme"
import { useDrawerOpen } from "./useDrawerOpen"

interface NavBarProps extends AppBarProps {
  open: boolean
  drawerWidth: number
}

const StyledTitle = styled(Typography)(({ theme }) => ({
  flexGrow: 1,
  fontWeight: "bold",
  fontSize: "1.5rem",
}))

const NavBar = styled(AppBar, {
  shouldForwardProp: (prop) => prop != "open" && prop != "drawerWidth",
})<NavBarProps>(({ drawerWidth, open, theme }) => ({
  zIndex: (theme.zIndex as ZIndex).drawer + 1,
  height: (theme.mixins as Mixins).toolbar.minHeight,
  transition: (theme.transitions as Transitions).create(["width", "margin"], {
    easing: (theme.transitions as Transitions).easing.sharp,
    duration: (theme.transitions as Transitions).duration.leavingScreen,
  }),
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginLeft: `${drawerWidth}px`,
    transition: (theme.transitions as Transitions).create(["width", "margin"], {
      easing: (theme.transitions as Transitions).easing.sharp,
      duration: (theme.transitions as Transitions).duration.enteringScreen,
    }),
  }),
}))

export const StyledNavBar: React.FC<AppBarProps> = (props) => {
  const drawer = useDrawerOpen()
  const theme = useInsightTheme()

  const drawerWidth = () =>
    drawer.drawerOpenState ? theme.dimensions.drawerOpen : theme.dimensions.drawerClosed

  return (
    <>
      <NavBar
        position="fixed"
        open={drawer.drawerOpenState}
        drawerWidth={drawerWidth()}
      >
        <Toolbar>
          <IconButton
            aria-label="open drawer"
            edge="start"
            onClick={drawer.toggleDrawer}
            sx={{
              marginRight: 5,
              ...(drawer.drawerOpenState && { display: "none" }),
            }}
          >
            <MdIcons.MdMenu />
          </IconButton>
          <img src={Logo} alt="" />
          <StyledTitle>Insight</StyledTitle>
          <Box>
            <IconButton
              edge="end"
              aria-label="GitHub Repository"
              href="https://github.com/zio/zio-insight-ui"
              target="_blank"
            >
              <FaIcons.FaGithub />
            </IconButton>
          </Box>
        </Toolbar>
      </NavBar>
    </>
  )
}
