import type * as HashMap from "@effect/data/HashMap"
import type * as Option from "@effect/data/Option"
import type * as React from "react"
import type { Layouts } from "react-grid-layout"

export interface ConfigurableContent {
  title: string
  content: React.ReactElement
  config?: React.ReactElement
}

export interface DashboardState {
  // the name of the current breakpoint, such as "lg", "md" etc
  breakpoint: string
  // The panel layouts for each breakpoint. Basically it is an object whit the breakpoint
  // names as keys and each key will point to an array of panel layouts
  // The layout arrays will be managed via the panel operations. Each panel will have its own
  // id set in the "i" field of the layout. The id is used to match the actual content for the
  // panel from the content field below.
  layouts: Layouts
  // The actual panel contents, each individual entry will hold a React Element representing
  // the panel content and an optional React Element to configure the content panel. If the config
  // is defined the GridFrame will show a corresponding "edit" button to switch to the config
  // panel, a config panel will always be shown maximized. If another content panel is currently
  // maximized, the config panel will take precedence.
  content: HashMap.HashMap<string, ConfigurableContent>
  // If set, maximized will contain the id of a panel that shall be shown maximized,
  // In that case the corresponding panel will take all space of the dashboard view
  // including the control buttons at the top of the Dashboard
  maximized: Option.Option<string>
  // If set, configure will call the configure function to create a configuration panel
  // for the configuration of the panel with the given id.
  // If both maximized AND configure are set, the configure panel takes precedence
  // Typically a config dialog would modify the state in some Memory Store service
  // within the app runtime so that any interested panel can consume the modified
  // configuration.
  configure: Option.Option<string>
}
