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
    large: number
    medium: number
    small: number
    xsmall: number
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
      main: "#254490",
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
  status: {
    Root: "gray",
    Suspended: "gold",
    Running: "cornflowerblue",
    Succeeded: "lightseagreen",
    Errored: "lightcoral"
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

  return theme
}
