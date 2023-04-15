import { useTheme } from "@mui/material"
import type { Theme } from "@mui/material"
import * as MUIStyles from "@mui/material/styles"

export interface InsightTheme extends Theme {
  dimensions: {
    drawerClosed: number
    drawerOpen: number
  }
  status: {
    Root: string
    Suspended: string
    Running: string
    Succeeded: string
    Errored: string
  }
  padding: {
    [key: string]: number
  }
}

const muiTheme = MUIStyles.createTheme({
  palette: {
    primary: {
      main: "#404350",
      light: "#5f616d",
      dark: "#262830",
    },
    secondary: {
      //main: "#B10101",
      main: "#2524b0",
      //main: "#009020"
    },
    background: {
      default: "#d0d0d0",
      paper: "#f0f0e8",
    },
  },
})

export const insightTheme: InsightTheme = {
  ...muiTheme,
  dimensions: {
    drawerClosed: 56,
    drawerOpen: 240,
  },
  // This is the palette we are using for rendering the state of fibers
  status: {
    // An artificial state used for all fibers that we do not have a parent for in the runtime
    Root: "gray",
    // Suspended an Running are the active states
    Suspended: "gold",
    Running: "cornflowerblue",
    // Errored and Succeeded are the states for terminated fibers that "linger" for a while to be visualized
    Succeeded: "lightseagreen",
    Errored: "lightcoral",
  },
  padding: {
    large: 16,
    medium: 12,
    small: 8,
    xsmall: 4,
  },
}

export function mixins(self: InsightTheme) {
  return self.mixins as MUIStyles.Mixins
}

export function useInsightTheme() {
  const theme = useTheme() as InsightTheme

  return {
    theme,
    mixins: theme.mixins as MUIStyles.Mixins,
    transitions: theme.transitions as MUIStyles.Transitions,
    pxPadding: (() => {
      const res: {
        [key: string]: string
      } = {}
      Object.keys(theme.padding).forEach((k) => (res[k] = `${theme.padding[k]}px`))
      return res
    })(),
  }
}
