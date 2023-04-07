import { useLocalStorage } from "usehooks-ts"

// It is important that the open state is kept in the local storage, so that it can be shared acrros different
// components.
export function useDrawerOpen() {
  const [drawerOpenState, setDrawerOpenState] = useLocalStorage("drawerOpen", true)

  const toggleDrawer = () => {
    setDrawerOpenState(!drawerOpenState)
  }

  const drawerWidth = () => (drawerOpenState ? 240 : 48)

  return {
    drawerOpenState,
    drawerWidth,
    toggleDrawer,
  }
}
