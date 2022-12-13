

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

export class DashboardConfig { 
  constructor(
    // The title of the dashboard that will be used 
    readonly title: string
  ) {}

  copy(p: {
    title?: string
  }
  ) { 
    return new DashboardConfig(
      p.title || this.title
    )
  }
}

export interface DashboardManager { 

}