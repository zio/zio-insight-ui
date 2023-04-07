import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import { routes } from "@components/routes/AppRoutes"
import {
  Drawer,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Mixins,
  ListItemProps,
} from "@mui/material"
import { styled } from "@mui/system"
import * as React from "react"
import * as FaIcons from "react-icons/fa"
import { NavLink } from "react-router-dom"

interface LinkProps extends ListItemProps {
  isActive: boolean
}

const StyledItem = styled(
  ListItem,
  {}
)<LinkProps>(({ theme, isActive }) => ({
  backgroundColor: isActive ? "red" : "blue",
  textDecoration: "none",
  color: "inherit",
  fontSize: "2rem",
  fontWeight: "bold",
  padding: 0,
}))

export const SideBar: React.FC<{}> = (props) => {
  const drawer = useDrawerOpen()

  return (
    <StyledDrawer variant="permanent">
      <DrawerHeader>
        <IconButton onClick={drawer.toggleDrawer}>
          {drawer.drawerOpenState ? <FaIcons.FaAngleLeft /> : <FaIcons.FaAngleRight />}
        </IconButton>
      </DrawerHeader>
      <Divider />
      <List
        sx={{
          width: `${drawer.drawerWidth}px`,
        }}
      >
        {routes.map((route) => (
          <NavLink key={route.path} data-tip={route.title} to={route.path}>
            {({ isActive }) => {
              return (
                <StyledItem key={route.title} isActive={isActive}>
                  <ListItemButton>
                    <ListItemIcon>{route.icon}</ListItemIcon>
                    <ListItemText primary={route.title} />
                  </ListItemButton>
                </StyledItem>
              )
            }}
          </NavLink>
        ))}
      </List>
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
}))

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  // necessary for content to be below app bar
  ...(theme.mixins as Mixins).toolbar,
}))
