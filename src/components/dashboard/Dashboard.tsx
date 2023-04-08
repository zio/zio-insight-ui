import * as App from "@components/app/App"
import * as TK from "@data/testkeys"
import * as Chunk from "@effect/data/Chunk"
import * as HashMap from "@effect/data/HashMap"
import * as HashSet from "@effect/data/HashSet"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Runtime from "@effect/io/Runtime"
import * as IdSvc from "@services/idgenerator/IdGenerator"
import "@styles/grid.css"
import * as React from "react"
import type { Layout, Layouts } from "react-grid-layout"
import { Responsive, WidthProvider } from "react-grid-layout"
import * as BiIcons from "react-icons/bi"
import * as MdIcons from "react-icons/md"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import * as GDM from "@core/metrics/services/GraphDataManager"
import * as InsightSvc from "@core/metrics/services/InsightService"

import { ChartConfigPanel } from "../chart/ChartConfigPanel"
import { ChartPanel } from "../chart/ChartPanel"
import { GridFrame } from "../gridframe/GridFrame"

// An Insight Dashboard uses react-grid-layout under the covers to allow the users to create and arrange their
// panels as they see fit. In that sense a dashboard is a collection of views, each of which is an instance of
// a React Element. This element is embedded in a Grid Frame which is the interface between the Dashboard and
// the content view. Logically, the dashboard only knows about layouts and arrangements while the content views
// themselves are not aware of being rendered in the dashboard.

// As an overall guideline think of a dashboard that contains a set of metric viewer panels, a service dependency
// graph and a fiber trace viewer

// A GridFrame will provide a standard set of operations like "maximize" and "close".
// A GridFrame might also be configurable, in this case the frame controls will also have an "edit" button
// to invoke a panel specific configuration dialog

// A dashboard configuration shall be (de)serializable to/from the local storage, so that users can easily
// navigate between different dashboards

export interface ConfigurableContent {
  title: string
  content: React.ReactElement
  config?: React.ReactElement
}

interface DashboardState {
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

export function InsightGridLayout() {
  // We need to tap into the runtime to have access to the services
  const appRt = React.useContext(App.RuntimeContext)

  // The initial state for the dashboard with predefined breakpoints and empty layout/content.
  const [dbState, setState] = React.useState<DashboardState>({
    breakpoint: "md",
    layouts: {
      md: [],
      lg: [],
    },
    content: HashMap.empty(),
    maximized: Option.none(),
    configure: Option.none(),
  } as DashboardState)

  const updateState = (p: {
    newBreakpoint?: string
    newLayouts?: Layouts
    newContent?: HashMap.HashMap<string, ConfigurableContent>
    newMaximized?: Option.Option<string>
    newConfigure?: Option.Option<string>
  }) => {
    setState((curr) => {
      return {
        breakpoint: p.newBreakpoint || curr.breakpoint,
        layouts: p.newLayouts || curr.layouts,
        content: p.newContent || curr.content,
        maximized: p.newMaximized || curr.maximized,
        configure: p.newConfigure || curr.configure,
      } as DashboardState
    })
  }

  // TODO: This must be replaced with a proper config page. For now we are randomly choosing
  // an existing metric to actually see some graph being rendered
  const randomKey = Effect.gen(function* ($) {
    const gdm = yield* $(GDM.GraphDataManager)
    const app = yield* $(InsightSvc.InsightService)
    const idSvc = yield* $(IdSvc.IdGenerator)
    const panelId = yield* $(idSvc.nextId("panel"))
    const keys = Chunk.fromIterable(yield* $(app.getMetricKeys))
    const idx = Math.floor(Math.random() * Chunk.size(keys))
    const gk = yield* $(TK.gaugeKey)
    const res: InsightKey = Option.getOrElse(Chunk.get(keys, idx), () => gk)
    const gds = yield* $(gdm.register(panelId))
    yield* $(gds.setMetrics(HashSet.make(res)))

    return panelId
  })

  // A callback to remove a panel from the dashboard by removing it
  // from all layouts and also from the content map
  const removePanel = (panelId: string) => {
    const removeFromLayout = (id: string, l: Layout[]) => {
      return l.filter((c) => c.i != id)
    }

    Runtime.runPromise(appRt)(
      Effect.gen(function* ($) {
        const gdm = yield* $(GDM.GraphDataManager)
        yield* $(gdm.deregister(panelId))
      })
    ).then(() =>
      setState((curr) => {
        const layouts = curr.layouts

        for (const k in layouts) {
          layouts[k] = removeFromLayout(panelId, layouts[k] || [])
        }

        return {
          breakpoint: curr.breakpoint,
          layouts,
          content: HashMap.remove(panelId)(curr.content),
          // If we close the currently maximized panel we need to clear the
          // maximized flag as well
          maximized: (() => {
            switch (curr.maximized._tag) {
              case "None":
                return Option.none()
              case "Some":
                if (curr.maximized.value == panelId) {
                  return Option.none()
                } else {
                  return curr.maximized
                }
            }
          })(),
          configure: (() => {
            switch (curr.configure._tag) {
              case "None":
                return Option.none()
              case "Some":
                if (curr.configure.value == panelId) {
                  return Option.none()
                } else {
                  return curr.configure
                }
            }
          })(),
        } as DashboardState
      })
    )
  }

  const toggle = (panelId: string, view: "Max" | "Cfg") => {
    setState((state) => {
      const curr = (() => {
        switch (view) {
          case "Max":
            return state.maximized
          case "Cfg":
            return state.configure
        }
      })()

      const newVal = (() => {
        switch (curr._tag) {
          case "None":
            return Option.some(panelId)
          case "Some":
            if (curr.value === panelId) {
              return Option.none()
            } else {
              return curr
            }
        }
      })()

      switch (view) {
        case "Max":
          return {
            breakpoint: state.breakpoint,
            layouts: state.layouts,
            content: state.content,
            maximized: newVal,
            configure: state.configure,
          }
        case "Cfg":
          return {
            breakpoint: state.breakpoint,
            layouts: state.layouts,
            content: state.content,
            maximized: state.maximized,
            configure: newVal,
          }
      }
    })
  }

  // A callback to toggle the maximized state for a panel with a given id.
  // If a panel is currently maximized, this method needs to be called with
  // the id of the currently maximized panel to restore the normal state.
  const maximizePanel = (panelId: string) => toggle(panelId, "Max")

  // A callback to toggle the config mode for a panel with a given id.
  const configurePanel = (panelId: string) => toggle(panelId, "Cfg")

  // A callback to create a panel
  // TODO: Most like this should create a TSConfig and stick that into the underlying
  // panel as an init parameter. That would make the entire dashboard serializable
  const addPanel = () => {
    Runtime.runCallback(appRt)(randomKey, (res) => {
      switch (res._tag) {
        case "Failure":
          break
        case "Success": {
          const newPanel = <ChartPanel id={res.value} />
          const cfgPanel = (
            <ChartConfigPanel
              id={res.value}
              onDone={(k: string) => configurePanel(k)}
            />
          )

          const newLayout: Layout = { i: res.value, x: 0, y: 0, w: 3, h: 6 }
          const layouts = dbState.layouts
          for (const k in layouts) {
            layouts[k].push(newLayout)
          }

          updateState({
            newLayouts: layouts,
            newContent: HashMap.set(res.value, {
              title: `${res.value}`,
              content: newPanel,
              config: cfgPanel,
            } as ConfigurableContent)(dbState.content),
          })
        }
      }
    })
  }

  const configMode = (panelId: string) => {
    return Option.getOrElse(() => false)(
      Option.map((v) => v == panelId)(dbState.configure)
    )
  }

  const ResponsiveGridLayout = WidthProvider(Responsive)

  const renderDashboard = () => {
    return (
      <div className="w-full h-full flex flex-col p-2">
        <div className="flex flex-row justify-between">
          <span className="btn btn-primary" onClick={() => addPanel()}>
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

        <ResponsiveGridLayout
          className="layout w-full h-full"
          compactType="horizontal"
          layouts={dbState.layouts}
          cols={{ md: 8, lg: 12 }}
          onLayoutChange={(_: Layout[], all: Layouts) =>
            updateState({ newLayouts: all })
          }
          onBreakpointChange={(bp: string, _: number) =>
            updateState({ newBreakpoint: bp })
          }
          rowHeight={50}
        >
          {HashMap.mapWithIndex(dbState.content, (ct, id) => {
            return (
              <div key={id} className="w-full h-full bg-neutral text-neutral-content">
                <GridFrame
                  key={id}
                  title={ct.title}
                  maximized={false}
                  configMode={false}
                  id={id}
                  closePanel={removePanel}
                  configure={configurePanel}
                  maximize={maximizePanel}
                  content={ct.content}
                  config={ct.config}
                ></GridFrame>
              </div>
            )
          })}
        </ResponsiveGridLayout>
      </div>
    )
  }

  const renderMaximized = (id: string) => {
    const mbMax = HashMap.get(dbState.content, id)

    switch (mbMax._tag) {
      case "None":
        return renderDashboard()
      case "Some":
        return (
          <GridFrame
            key={id}
            title={id}
            configMode={configMode(id)}
            maximized={true}
            id={id}
            closePanel={removePanel}
            configure={configurePanel}
            maximize={maximizePanel}
            content={mbMax.value.content}
            config={mbMax.value.config}
          ></GridFrame>
        )
    }
  }

  switch (dbState.configure._tag) {
    case "None":
      switch (dbState.maximized._tag) {
        case "None":
          return renderDashboard()
        case "Some":
          return renderMaximized(dbState.maximized.value)
      }
    case "Some":
      return renderMaximized(dbState.configure.value)
  }
}
