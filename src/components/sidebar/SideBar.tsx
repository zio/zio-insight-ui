import { useDrawerOpen } from "@components/navbar/useDrawerOpen"
import { routes } from "@components/routes/AppRoutes"
import { useInsightTheme } from "@components/theme/InsightTheme"
import {
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
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

interface DrawerHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  drawerWidth: number
}

const DrawerHeader = styled("div", {
  shouldForwardProp: (prop) => prop != "drawerWidth",
})<DrawerHeaderProps>(({ drawerWidth, theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  backgroundColor: theme.palette.primary.dark,
  width: drawerWidth,
  height: (theme.mixins as Mixins).toolbar.minHeight,
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
  const theme = useInsightTheme()

  const drawerWidth = () =>
    drawer.drawerOpenState
      ? theme.theme.dimensions.drawerOpen
      : theme.theme.dimensions.drawerClosed

  return (
    <StyledDrawer drawerWidth={drawerWidth()} variant="permanent">
      <DrawerHeader drawerWidth={drawerWidth()}>
        <IconButton onClick={drawer.toggleDrawer}>
          {drawer.drawerOpenState ? <FaIcons.FaAngleLeft /> : <FaIcons.FaAngleRight />}
        </IconButton>
      </DrawerHeader>
      <Divider
        sx={{
          backgroundColor: theme.theme.palette.primary.contrastText,
        }}
      />
      <List
        sx={{
          width: `${drawerWidth()}px`,
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
                      ? theme.theme.palette.secondary.dark
                      : theme.theme.palette.primary.dark,
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
