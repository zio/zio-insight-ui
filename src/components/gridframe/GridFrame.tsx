import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Button, IconButton } from "@mui/material"
import * as RxIcons from "@radix-ui/react-icons"
import * as React from "react"
import { IconType } from "react-icons"
import * as AiIcons from "react-icons/ai"
import * as BoxIcons from "react-icons/bi"
import * as BsIcons from "react-icons/bs"
import * as Feather from "react-icons/fi"
import * as Tabler from "react-icons/tb"

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

export const GridFrame: React.FC<GridFrameProps> = (props) => {
  const theme = useInsightTheme()

  const closeHandler = () => props.closePanel(props.id)
  const maxHandler = () => props.maximize(props.id)
  const cfgHandler = () => props.configure(props.id)

  const cfgEnabled = props.config !== undefined && props.configMode

  // The controls that are shown when the panel is maximized
  const maxControls = () => {
    return (
      <Box
        sx={{
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Button
          onClick={cfgEnabled ? cfgHandler : maxHandler}
          startIcon={<BsIcons.BsArrowLeft />}
        >
          Back
        </Button>
      </Box>
    )
  }

  // The controls that are shown when the panel is not maximized
  const panelControls = () => {
    const panelButton = (icon: React.ReactElement, handler: () => void) => {
      return (
        <Box
          onClick={handler}
          sx={{
            display: "flex",
            alignContent: "center",
            backgroundColor: theme.palette.secondary.main,
            padding: `${theme.padding.xsmall}px`,
            ml: `${theme.padding.xsmall}px`,
            borderRadius: "50%",
          }}
        >
          {icon}
        </Box>
      )
    }

    return (
      <Box
        sx={{
          padding: `${theme.padding.xsmall}px`,
          display: "flex",
          flexDirection: "row",
          justifyContent: "flex-end",
          height: `${
            theme.padding.medium + 2 * theme.padding.xsmall + 2 * theme.padding.xsmall
          }px`,
        }}
      >
        {panelButton(
          <Tabler.TbArrowsMaximize size={theme.padding.medium} />,
          maxHandler
        )}
        {props.config === undefined ? (
          <></>
        ) : (
          panelButton(<Feather.FiEdit size={theme.padding.medium} />, cfgHandler)
        )}
        {panelButton(
          <AiIcons.AiOutlineClose size={theme.padding.medium} />,
          closeHandler
        )}
      </Box>
    )
  }

  // The controls that are shown on the panel
  const controls = () => {
    return props.maximized ? maxControls() : panelControls()
  }

  // The move handle bar that is shown when the panel is not maximized
  // It is shown on the left hand side of the panel and allows the user
  // to move the panel around the layout
  const moveHandleBar = () => {
    return props.maximized || cfgEnabled ? (
      <></>
    ) : (
      <Box
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 0,
          backgroundColor: theme.palette.primary.dark,
          borderRadius: `${theme.padding.small}px 0px 0px ${theme.padding.small}px`,
          justifyContent: "center",
          cursor: "move",
        }}
      >
        <BoxIcons.BiGridVertical />
      </Box>
    )
  }

  const resizeHandle = () => {
    const size = `${theme.padding.medium}px`
    if (cfgEnabled || props.maximized) return <></>
    else
      return (
        <Box
          sx={{
            position: "absolute",
            bottom: theme.padding.xsmall,
            right: 0,
            height: size,
          }}
        >
          <RxIcons.CornerBottomRightIcon width={size} height={size} />
        </Box>
      )
  }

  // The complete panel using the components above
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        justifyItems: "stretch",
        height: "100%",
        borderRadius: `${theme.padding.small}px`,
        backgroundColor: theme.palette.background.paper,
      }}
    >
      {moveHandleBar()}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {controls()}
        {resizeHandle()}
      </Box>
    </Box>
    // <div className="grow h-full flex flex-row justify-items-stretch">
    //   <div className="grow h-full flex flex-col">
    //     <div className="m-1 flex flex-row flex-none justify-between place-items-center">
    //       <span
    //         className={`${
    //           props.maximized || cfgEnabled ? "ml-2 underline text-2xl" : ""
    //         }`}
    //       >
    //         {props.title}
    //       </span>
    //       {controls()}
    //     </div>

    //     <div className="grow grid grid-col-1 m-2 place-items-stretch">
    //       <div
    //         className={`overflow-auto grid grid-col-1 place-items-stretch ${
    //           props.maximized || cfgEnabled ? "" : "p-2 border"
    //         }`}
    //       >
    //         {(() => {
    //           if (cfgEnabled) return props.config || props.content
    //           else return props.content
    //         })()}
    //       </div>
    //     </div>

    //     {(() => {
    //       if (cfgEnabled || props.maximized) return <></>
    //       else
    //         return (
    //           <div className="flex flex-none">
    //             <ResizeHandle />
    //           </div>
    //         )
    //     })()}
    //   </div>
    // </div>
  )
}
