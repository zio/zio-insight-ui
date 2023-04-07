import * as NavBar from "@components/navbar/NavBar"
import * as SideBar from "@components/sidebar/SideBar"
import { Box } from "@mui/material"
import { styled } from "@mui/system"
import * as React from "react"

export const AppLayout: React.FC<{}> = (props) => {
  return (
    <Box sx={{ display: "flex" }}>
      <NavBar.StyledNavBar />
      <SideBar.SideBar />
    </Box>
  )
}

const ClientContainer = styled("div")(({ theme }) => ({
  width: "100vw",
  height: "100vh",
  display: "flex relative",
  flexDirection: "row",
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
