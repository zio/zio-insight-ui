import * as T from "@effect/core/io/Effect"
import { Tag } from "@tsplus/stdlib/service/Tag"

// The dashboard manager keeps track of the configured dashboards 
// within the application. 

// Each dashboard occupies the entire "Outlet" space within the layout
// and is uniquely identified by an ID. The fault dashboard id is "default"
// and will be shown when the user navigates to the default dashboard without 
// further information. 

// Whenever a dashboard is saved, the user can enter different name and the 
// current dashboard state will be stored under that name. 

// A dashboard consists of n individual panels showing some content. The content 
// typically is a react component that dynamically sizes itself to the available 
// space. 

// The config for an individual panel consists of the panel id, the coordinates 
// and an untyped config object.

// When a panel is to be restored on the Dashboard, the DashboardManager iterates 
// over the configured dashboard panels and for each panel understands the layout 
// settings. Also for each panel it understands the raw panel config (unknown)
// and uses the Content Manager to create the content panel and potentially the 
// associated config panel. 

export interface Tagged { 
  readonly _tag: string
}

export const metricsCfgTag = Tag<MetricsConfig>()

export class MetricsConfig implements Tagged { 
  readonly _tag = "MetricsConfig"
}

export class PanelConfig {
  constructor(
    readonly id: string, 
    readonly x: number, 
    readonly y: number, 
    readonly w: number, 
    readonly h: number, 
    readonly config: Tagged
  ) {}
}

export class DashboardConfig { 
  constructor(
    // The unique id used to locate the dashboard config within the persistence layer 
    readonly id: string,
    // The title of the dashboard that will be used in the UI
    readonly title: string,
    // A textual description of the dashboard to show in the UI where appropriate
    readonly description : string = "",
    // The actual dashboard content
    readonly content: PanelConfig[] = []
  ) {}

  copy(p: {
    id?: string
    title?: string,
    content?: PanelConfig[]
    description?: string
  }
  ) { 
    return new DashboardConfig(
      p.id || this.id,
      p.title || this.title,
      p.description || this.description,
      p.content || this.content
    )
  }
}

export interface DashboardManager {
  
  // Create a new and empty dashboard with a new id 
  create: () => T.Effect<never, never, DashboardConfig>

  // Get a dashboard by its id // if the dashboard could not be 
  // found, create and return an empty one 
  get: (id: string) => T.Effect<never, never, DashboardConfig>

  put: (cfg: DashboardConfig) => T.Effect<never, never, void>

  delete: (id: string) => T.Effect<never, never, void>

  list: () => T.Effect<never, never, DashboardConfig[]>


}