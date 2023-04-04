import * as NavBar from "@components/navbar/NavBar"
import * as SideBar from "@components/sidebar/SideBar"
import { styled } from "@mui/system"
import * as React from "react"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <>
      <NavBar.StyledNavBar
        onMenuClick={() => {
          /* Do Nothing */
        }}
      />
      <RootContainer>
        <SideBar.SideBar />
        <Outlet />
      </RootContainer>
    </>
  )
}

const RootContainer = styled("div")(({ theme }) => ({
  width: "100vw",
  height: "calc(100vh - 64px)",
  top: "64px",
  position: "absolute",
  backgroundColor: theme.palette.background.default,
  display: "flex",
  flexDirection: "row",
}))
