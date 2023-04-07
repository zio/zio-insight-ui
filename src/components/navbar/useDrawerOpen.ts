import * as React from "react"

export const useDrawerOpen = () => {
  const [drawerOpenState, setDrawerOpenState] = React.useState<boolean>(true)

  const toggleDrawer = () => setDrawerOpenState(!drawerOpenState)

  return {
    drawerOpenState,
    toggleDrawer,
  }
}
