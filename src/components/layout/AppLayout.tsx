import * as NavBar from "@components/navbar/NavBar"
import * as React from "react"

export function AppLayout() {
  return (
    <NavBar.NavBar
      onMenuClick={() => {
        /* Do Nothing */
      }}
    />
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
