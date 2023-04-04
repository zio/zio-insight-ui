import * as NavBar from "@components/navbar/NavBar"
import * as SideBar from "@components/sidebar/SideBar"
import { styled } from "@mui/system"
import * as React from "react"
import { Outlet } from "react-router-dom"

export function AppLayout() {
  return (
    <ClientContainer>
      <SideBar.SideBar />
      <RootContainer>
        <NavBar.NavBar
          onMenuClick={() => {
            /* Do Nothing */
          }}
        />
        <Outlet />
      </RootContainer>
    </ClientContainer>
  )
}

const ClientContainer = styled("div")(({ theme }) => ({
  width: "100vw",
  height: "100vh",
  display: "flex relative",
}))

const RootContainer = styled("div")(({ theme }) => ({
  width: "calc(100vw-240px)",
  height: "calc(100vh - 64px)",
  top: "64px",
  left: "240px",
  position: "absolute",
  backgroundColor: theme.palette.background.default,
  display: "flex relative",
  flexDirection: "row",
}))
