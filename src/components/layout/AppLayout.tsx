import * as MUICore from "@mui/material"
import * as MUIStyles from "@mui/material/styles"
import * as React from "react"

import { NavBar } from "../navbar/NavBar"
import { SideBar } from "../sidebar/SideBar"

export function AppLayout() {
  return (
    <MUICore.Box sx={{ flexGrow: 1 }}>
      <MUICore.AppBar position="static">
        <MUICore.Toolbar />
      </MUICore.AppBar>
    </MUICore.Box>
  )
}
// export function AppLayout() {
//   return (
//     <div className="w-screen h-screen flex flex-col" data-theme="insight">
//       <div className="flex flex-row h-full">
//         <SideBar />
//         <div className="flex flex-col justify-items stretch w-full h-full">
//           <NavBar />
//           <div className="grow bg-base-100">
//             <Outlet />
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
