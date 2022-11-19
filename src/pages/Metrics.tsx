import { MyGrid } from "@components/Grid"
import * as React from "react"
import * as BiIcons from "react-icons/bi"
import * as MdIcons from "react-icons/md"

export function Metrics() {
  return (
    <div className="w-full h-full flex flex-col p-2">
      <div className="flex flex-row justify-between">
        <span className="btn btn-primary">
          <MdIcons.MdAddChart />
          Create Panel
        </span>
        <span />
        <div className="flex flex-row">
          <span className="btn btn-neutral">
            <BiIcons.BiSave />
            Save this view
          </span>
          <span className="ml-2 btn btn-neutral btn-disabled">Select View</span>
        </div>
      </div>
      <div className="w-full h-full flex flex-grow">
        <MyGrid />
      </div>
    </div>
  )
}
