import react from "@vitejs/plugin-react"
import path from "path"
import { defineConfig } from "vite"
import svgr from "vite-plugin-svgr"
import tsConfigPaths from "vite-tsconfig-paths"

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    sourcemap: false
  },
  resolve: {
    alias: {
      "@static": path.resolve(__dirname, "./src/static"),
      "@styles": path.resolve(__dirname, "./src/styles"),
      "@core": path.resolve(__dirname, "./src/core"),
      "@components": path.resolve(__dirname, "./src/components")
    }
  },
  plugins: [
    svgr({
      exportAsDefault: false,
      svgrOptions: {
        jsxRuntime: "classic",
        typescript: false
      }
    }),
    react(),
    tsConfigPaths()
  ]
})
