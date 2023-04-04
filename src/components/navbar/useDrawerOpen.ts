import * as React from "react"
import { useLocalStorage } from "usehooks-ts"

export const useDrawerOpen = () => {
  const [drawerOpenState, setDrawerOpenState] = useLocalStorage("drawerOpen", true)

  const toggleDrawer = React.useCallback(
    () => setDrawerOpenState(!drawerOpenState),
    [setDrawerOpenState]
  )

  return {
    drawerOpenState,
    toggleDrawer,
  }
}
