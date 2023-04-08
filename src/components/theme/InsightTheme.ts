import { Theme, useTheme } from "@mui/material"
import * as MUIStyles from "@mui/material/styles"

export interface InsightTheme extends Theme {
  dimensions: {
    drawerClosed: number
    drawerOpen: number
    padding: number
  }
}

const muiTheme = MUIStyles.createTheme({
  palette: {
    primary: {
      main: "#404350",
      dark: "#262830",
    },
    secondary: {
      main: "#E74100B2",
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
    padding: 16,
  },
}

export function mixins(self: InsightTheme) {
  return self.mixins as MUIStyles.Mixins
}

export function useInsightTheme() {
  const theme = useTheme() as InsightTheme

  return theme
}
