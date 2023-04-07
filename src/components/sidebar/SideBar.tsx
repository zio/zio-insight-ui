import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import { routes } from "@components/routes/AppRoutes"
import {
  Drawer,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material"
import { styled } from "@mui/system"
import * as React from "react"
import * as FaIcons from "react-icons/fa"
import { NavLink } from "react-router-dom"

export const SideBar: React.FC<{}> = (props) => {
  const drawer = useDrawerOpen()

  return (
    <StyledDrawer variant="permanent">
      <ListItem>
        <ListItemButton>
          <ListItemIcon>
            {drawer.drawerOpenState ? (
              <FaIcons.FaAngleLeft onClick={drawer.toggleDrawer} />
            ) : (
              <FaIcons.FaAngleRight onClick={drawer.toggleDrawer} />
            )}
          </ListItemIcon>
        </ListItemButton>
      </ListItem>
      {routes.map((route) => (
        <NavLink
          key={route.path}
          data-tip={route.title}
          className={({ isActive }) => {
            return `py-2 text-xl font-extralight w-full flex flex-row border-b ${
              isActive ? "bg-accent" : "hover:bg-neutral-focus"
            } ${
              drawer.drawerOpenState ? "" : "tooltip tooltip-right tooltip-secondary"
            }`
          }}
          to={route.path}
        >
          <ListItem key={route.title} disablePadding>
            <ListItemButton>
              <ListItemIcon>{route.icon}</ListItemIcon>
              <ListItemText primary={route.title} />
            </ListItemButton>
          </ListItem>
        </NavLink>
      ))}
    </StyledDrawer>
    // <div
    //   className={`${
    //     drawer.drawerOpenState ? "w-48" : "w-14"
    //   } flex flex-col bg-neutral text-neutral-content border-r`}
    // >
    //   <div className="h-full flex flex-col">
    //     {routes.map((e) => (
    //       <NavLink
    //         key={e.path}
    //         data-tip={e.title}
    //         className={({ isActive }) => {
    //           return `py-2 text-xl font-extralight w-full flex flex-row border-b ${
    //             isActive ? "bg-accent" : "hover:bg-base-100"
    //           } ${
    //             drawer.drawerOpenState ? "" : "tooltip tooltip-right tooltip-secondary"
    //           }`
    //         }}
    //         to={e.path}
    //       >
    //         <div className="h-8 w-full flex flex-row justify-left">
    //           <span>{e.icon}</span>
    //           {drawer.drawerOpenState ? (
    //             <span className="flex self-center">{e.title}</span>
    //           ) : (
    //             <></>
    //           )}
    //         </div>
    //       </NavLink>
    //     ))}
    //   </div>
    // </div>
  )
}

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  width: "240px",
  height: "100%",
}))
