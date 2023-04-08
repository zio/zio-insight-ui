import { AppRouter } from "@components/routes/AppRouter"
import { insightTheme } from "@components/theme/InsightTheme"
import { CssBaseline, StyledEngineProvider } from "@mui/material"
import * as MUIStyles from "@mui/material/styles"
import * as React from "react"
import { IconContext } from "react-icons/lib"

import * as AL from "@core/AppLayer"

// To connect to a real ZIO application we need to use
// AL.appLayerLive
const runtime = AL.unsafeMakeRuntime(AL.appLayerStatic).runtime
export const RuntimeContext = React.createContext(runtime)

export function App() {
  return (
    <RuntimeContext.Provider value={runtime}>
      <CssBaseline />
      <MUIStyles.ThemeProvider theme={insightTheme}>
        <IconContext.Provider
          value={{
            color: insightTheme.palette.primary.contrastText,
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
