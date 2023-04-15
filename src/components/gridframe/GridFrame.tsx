import { useInsightTheme } from "@components/theme/InsightTheme"
import { Box, Button, Typography } from "@mui/material"
import * as RxIcons from "@radix-ui/react-icons"
import * as React from "react"
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

  // Render the title of the panel
  const title = (max: boolean) => {
    return (
      <Typography
        variant={max ? "h6" : "subtitle1"}
        sx={{
          color: theme.theme.palette.primary.contrastText,
          ml: theme.pxPadding.small,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        {props.title}
      </Typography>
    )
  }

  // The controls that are shown when the panel is maximized
  const maxControls = () => {
    return (
      <Box
        sx={{
          padding: theme.pxPadding.small,
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Button
          color="secondary"
          variant="contained"
          onClick={cfgEnabled ? cfgHandler : maxHandler}
          startIcon={<BsIcons.BsArrowLeft />}
          sx={{
            flexGrow: 0,
          }}
        >
          Back
        </Button>
        {title(true)}
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
            backgroundColor: theme.theme.palette.secondary.main,
            padding: theme.pxPadding.xsmall,
            ml: `theme.pxPadding.xsmall`,
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
          display: "flex",
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        {title(false)}
        <Box
          sx={{
            padding: theme.pxPadding.xsmall,
            display: "flex",
            flexDirection: "row",
            justifyContent: "flex-end",
            height: `${
              theme.theme.padding.medium +
              2 * theme.theme.padding.xsmall +
              2 * theme.theme.padding.xsmall
            }px`,
          }}
        >
          {panelButton(
            <Tabler.TbArrowsMaximize size={theme.theme.padding.medium} />,
            maxHandler
          )}
          {props.config === undefined ? (
            <></>
          ) : (
            panelButton(
              <Feather.FiEdit size={theme.theme.padding.medium} />,
              cfgHandler
            )
          )}
          {panelButton(
            <AiIcons.AiOutlineClose size={theme.theme.padding.medium} />,
            closeHandler
          )}
        </Box>
      </Box>
    )
  }

  // The controls that are shown on the panel
  const controls = () => {
    return (
      <Box
        sx={{
          borderRadius: `0 ${theme.pxPadding.small} 0 0`,
          backgroundColor: theme.theme.palette.primary.main,
        }}
      >
        {props.maximized ? maxControls() : panelControls()}
      </Box>
    )
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
          backgroundColor: theme.theme.palette.primary.dark,
          borderRadius: `${theme.pxPadding.small} 0px 0px ${theme.pxPadding.small}`,
          justifyContent: "center",
          cursor: "move",
        }}
      >
        <BoxIcons.BiGridVertical />
      </Box>
    )
  }

  const resizeHandle = () => {
    const size = theme.pxPadding.medium
    if (cfgEnabled || props.maximized) return <></>
    else
      return (
        <Box
          sx={{
            position: "absolute",
            bottom: theme.theme.padding.xsmall,
            right: 0,
            height: size,
          }}
        >
          <RxIcons.CornerBottomRightIcon width={size} height={size} />
        </Box>
      )
  }

  // The box for the actual content of the panel
  const content = () => {
    const inner = () => {
      if (cfgEnabled) return props.config || props.content
      else return props.content
    }

    return (
      <Box
        sx={{
          flexGrow: 1,
          overflow: "auto",
          placeItems: "stretch",
        }}
      >
        {inner()}
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
        borderRadius: theme.pxPadding.small,
        backgroundColor: theme.theme.palette.background.paper,
      }}
    >
      {moveHandleBar()}
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column" }}>
        {controls()}
        {content()}
        {resizeHandle()}
      </Box>
    </Box>
  )
}
