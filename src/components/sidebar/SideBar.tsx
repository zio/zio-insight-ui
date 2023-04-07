import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import { routes } from "@components/routes/AppRoutes"
import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  useTheme,
} from "@mui/material"
import type { DrawerProps, Mixins } from "@mui/material"
import { styled } from "@mui/system"
import * as React from "react"
import * as FaIcons from "react-icons/fa"
import { NavLink } from "react-router-dom"
import type { NavLinkProps } from "react-router-dom"

interface SideBarProps extends DrawerProps {
  drawerWidth: number
}

const StyledDrawer = styled(Drawer, {
  shouldForwardProp: (prop) => prop != "drawerWidth",
})<SideBarProps>(({ drawerWidth, theme }) => ({
  ".MuiPaper-root": {
    backgroundColor: theme.palette.primary.dark,
  },
  width: `${drawerWidth}px`,
}))

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  backgroundColor: theme.palette.primary.dark,
  // necessary for content to be below app bar
  ...(theme.mixins as Mixins).toolbar,
}))

const StyledLink = styled(
  NavLink,
  {}
)<NavLinkProps>(({ theme }) => ({
  ".MuiTypography-root": {
    color: theme.palette.primary.contrastText,
    fontSize: "1.2rem",
    fontWeight: "bold",
  },
  textDecoration: "none",
  padding: 0,
}))

export const SideBar: React.FC<{}> = (props) => {
  const drawer = useDrawerOpen()
  const theme = useTheme()

  return (
    <StyledDrawer drawerWidth={drawer.drawerWidth()} variant="permanent">
      <DrawerHeader>
        <IconButton onClick={drawer.toggleDrawer}>
          {drawer.drawerOpenState ? <FaIcons.FaAngleLeft /> : <FaIcons.FaAngleRight />}
        </IconButton>
      </DrawerHeader>
      <Divider
        sx={{
          backgroundColor: theme.palette.primary.contrastText,
        }}
      />
      <List
        sx={{
          width: `${drawer.drawerWidth()}px`,
        }}
      >
        {routes.map((route) => (
          <StyledLink key={route.path} data-tip={route.title} to={route.path}>
            {({ isActive }) => {
              return (
                <ListItem
                  key={route.title}
                  sx={{
                    backgroundColor: isActive
                      ? theme.palette.secondary.dark
                      : theme.palette.primary.dark,
                  }}
                >
                  <ListItemButton
                    sx={{
                      padding: 0,
                    }}
                  >
                    <ListItemIcon>{route.icon}</ListItemIcon>
                    {drawer.drawerOpenState ? (
                      <ListItemText primary={route.title} />
                    ) : (
                      <></>
                    )}
                  </ListItemButton>
                </ListItem>
              )
            }}
          </StyledLink>
        ))}
      </List>
    </StyledDrawer>
  )
}
