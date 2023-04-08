import { Theme, useTheme } from "@mui/material"
import * as MUIStyles from "@mui/material/styles"

export interface InsightTheme extends Theme {
  dimensions: {
    drawerClosed: number
    drawerOpen: number
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
      default: "#f5f5f5",
      paper: "#a0a0a0",
    },
  },
})

export const insightTheme: InsightTheme = {
  ...muiTheme,
  dimensions: {
    drawerClosed: 56,
    drawerOpen: 240,
  },
}

export function mixins(self: InsightTheme) {
  return self.mixins as MUIStyles.Mixins
}

export function useInsightTheme() {
  const theme = useTheme() as InsightTheme

  return theme
}
