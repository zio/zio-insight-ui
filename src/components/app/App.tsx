import { AppRouter } from "@components/routes/AppRouter"
import { CssBaseline, StyledEngineProvider } from "@mui/material"
import * as MUIStyles from "@mui/material/styles"
import * as React from "react"
import { IconContext } from "react-icons/lib"

import * as AL from "@core/AppLayer"

// To connect to a real ZIO application we need to use
// AL.appLayerLive
const runtime = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime
export const RuntimeContext = React.createContext(runtime)

const theme = MUIStyles.createTheme({
  palette: {
    primary: {
      main: "#404350",
    },
    secondary: {
      main: "#E74100B2",
    },
    background: {
      default: "#404350",
      paper: "#DDD",
    },
  },
})

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <CssBaseline />
      <MUIStyles.ThemeProvider theme={theme}>
        <IconContext.Provider
          value={{
            className: "text-neutral-content text-3xl mx-2",
          }}
        >
          <StyledEngineProvider injectFirst>
            <AppRouter />
          </StyledEngineProvider>
        </IconContext.Provider>
      </MUIStyles.ThemeProvider>
    </RuntimeContext.Provider>
  )
}
