import * as React from "react"
import * as AiIcons from "react-icons/ai"
import * as Feather from "react-icons/fi"
import * as Tabler from "react-icons/tb"
import * as BoxIcons from "react-icons/bi"
import * as RxIcons from "@radix-ui/react-icons"
import * as BsIcons from "react-icons/bs"

interface GridFrameProps {
  // The id to identify the panel within the layout
  id: string
  // The title to be rendered on the panels title bar
  title: string
  // whether the panel is currently maximized
  maximized: boolean
  // configMode true => show the config Panel
  // configMode false => show the actual content
  configMode: boolean
  // the callback method to remove the panel from the layout
  closePanel: (id: string) => void
  // The callback to maximize the panel
  maximize: (id: string) => void
  // The callback to switch config mode for the panel
  configure: (id: string) => void
  // The actual panel content
  content: React.ReactNode
  // The panel config component if any
  config?: React.ReactElement
}

const btnStyle = "ml-1 p-1 text-2xl rounded-full"

export const GridFrame: React.FC<GridFrameProps> = (props) => {
  const closeHandler = () => props.closePanel(props.id)
  const maxHandler = () => props.maximize(props.id)
  const cfgHandler = () => props.configure(props.id)

  const cfgEnabled = props.config !== undefined && props.configMode

  const controls = () => {
    if (cfgEnabled) {
      return (
        <div className="flex flex-row">
          <span className="btn btn-ghost" onClick={cfgHandler}>
            <BsIcons.BsArrowLeft />
            Back
          </span>
        </div>
      )
    } else {
      return (
        <div className="flex flex-row">
          <Tabler.TbArrowsMaximize
            className={`${btnStyle} btn-primary`}
            onClick={maxHandler}
          />
          {(() => {
            if (props.config !== undefined)
              return (
                <Feather.FiEdit
                  className={`${btnStyle} btn-primary`}
                  onClick={cfgHandler}
                />
              )
            else return <></>
          })()}
          <AiIcons.AiOutlineClose
            className={`${btnStyle} btn-ghost`}
            onClick={closeHandler}
          />
        </div>
      )
    }
  }

  return (
    <div className="grow h-full flex flex-row justify-items-stretch">
      {props.maximized || cfgEnabled ? (
        <></>
      ) : (
        <div className="flex flex-col flex-none bg-base-200 h-full justify-center">
          <BoxIcons.BiGridVertical className="w-full mx-auto cursor-move" />
        </div>
      )}
      <div className="grow h-full flex flex-col">
        <div className="m-1 flex flex-row flex-none justify-between place-items-center">
          <span>{props.title}</span>
          {controls()}
        </div>

        <div className="grow grid grid-col-1 m-2 place-items-stretch">
          <div
            className={`overflow-auto grid grid-col-1 place-items-stretch ${
              props.maximized || cfgEnabled ? "" : "p-2 border"
            }`}>
            {(() => {
              if (cfgEnabled) return props.config!
              else return props.content
            })()}
          </div>
        </div>

        {(() => {
          if (cfgEnabled || props.maximized) return <></>
          else
            return (
              <div className="flex flex-none">
                <ResizeHandle />
              </div>
            )
        })()}
      </div>
    </div>
  )
}

const ResizeHandle: React.FC<{}> = () => {
  return (
    <RxIcons.CornerBottomRightIcon className="mx-0 absolute right-0 bottom-0 text-xs" />
  )
}
