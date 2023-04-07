import * as NavBar from "@components/navbar/NavBar"
import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import * as SideBar from "@components/sidebar/SideBar"
import { Box, BoxProps } from "@mui/material"
import { styled } from "@mui/system"
import * as React from "react"

interface MainBoxProps extends BoxProps {
  drawerWidth: number
}

const MainBox = styled(Box, {
  shouldForwardProp: (prop) => prop != "drawerWidth",
})<MainBoxProps>(({ theme, drawerWidth }) => ({
  position: "absolute",
  top: "64px",
  left: drawerWidth,
  bottom: 0,
  right: 0,
}))

export const AppLayout: React.FC<{}> = (props) => {
  const drawer = useDrawerOpen()

  return (
    <>
      <NavBar.StyledNavBar />
      <SideBar.SideBar />
      <MainBox component="main" drawerWidth={drawer.drawerWidth()}>
        <h1>Hello</h1>
      </MainBox>
    </>
  )
}
