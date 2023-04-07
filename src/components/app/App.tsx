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
      dark: "#262830",
    },
    secondary: {
      main: "#E74100B2",
    },
    background: {
      default: "#f5f5f5",
      paper: "#a0a0a0",
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
            color: theme.palette.primary.contrastText,
            size: "1.5em",
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
