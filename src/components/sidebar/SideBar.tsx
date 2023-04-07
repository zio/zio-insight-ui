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

const StyledItem = styled(
  ListItem,
  {}
)<LinkProps>(({ theme, isActive }) => ({
  ".MuiTypography-root": {
    color: "white",
    textDecoration: "none",
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  backgroundColor: isActive ? theme.palette.secondary.main : "inherit",
  color: "inherit",
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
          width: `${drawer.drawerWidth()}px`,
        }}
      >
        {routes.map((route) => (
          <NavLink key={route.path} data-tip={route.title} to={route.path}>
            {({ isActive }) => {
              return (
                <StyledItem key={route.title} isActive={isActive}>
                  <ListItemButton>
                    <ListItemIcon>{route.icon}</ListItemIcon>
                    {drawer.drawerOpenState ? (
                      <ListItemText primary={route.title} />
                    ) : (
                      <></>
                    )}
                  </ListItemButton>
                </StyledItem>
              )
            }}
          </NavLink>
        ))}
      </List>
    </StyledDrawer>
  )
}
