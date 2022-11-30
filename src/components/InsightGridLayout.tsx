import * as T from "@effect/core/io/Effect"
import * as React from "react"
import { Layout, Layouts, Responsive, WidthProvider } from "react-grid-layout"
import * as App from "@components/App"
import "@styles/grid.css"
import { ChartContainer } from "./panel/ChartPanel"
import { GridFrame } from "./panel/GridFrame"
import * as TK from "@data/testkeys"
import * as HMap from "@tsplus/stdlib/collections/HashMap"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as InsightSvc from "@core/metrics/service/InsightService"
import * as IdSvc from "@core/services/IdGenerator"
import * as MdIcons from "react-icons/md"
import * as BiIcons from "react-icons/bi"

// An Insight Dashboard uses react-grid-layout under the covers to allow the users to create and arrange their
// panels as they see fit. In that sense a dashboard is a collection of views, each of which is an instance of
// a React Element. This element is embedded in a Grid Frame which is the interface between the Dashboard and
// the content view. Logically, the dashboard only knows about layouts and arrangements while the content views
// themselves are not aware of being rendered in the dashboard.

// A GridFrame will provide a standard set of operations like "edit", "maximize" and "close".

// A dashboard configuration shall be (de)serializable to/from the local storage, so that users can easily
// navigate between different dashboards

interface DashboardState {
  // the name of the current breakpoint, such as "lg", "md" etc
  breakpoint: string
  // The panel layouts for each breakpoint. Basically it is an object whit the breakpoint
  // names as keys and each key will point to an array of panel layouts
  // The layout arrays will be managed via the panel operations. Each panel will have its own
  // id set in the "i" field of the layout. The id is used to match the actual content for the
  // panel from the content field below.
  layouts: Layouts
  content: HMap.HashMap<string, React.ReactElement>
}

export function InsightGridLayout() {
  // We need to tap into the runtime to have access to the services
  const appRt = React.useContext(App.RuntimeContext)

  // The initial state for the dashboard with predefined breakpoints and empty layout/content.
  const [dbState, setState] = React.useState<DashboardState>({
    breakpoint: "md",
    layouts: {
      md: [],
      lg: []
    },
    content: HMap.empty()
  } as DashboardState)

  // TODO: This must be replaced with a proper config page. For now we are randomly choosing
  // an existing metric to actually see some graph being rendered
  const randomKey = T.gen(function* ($) {
    const app = yield* $(T.service(InsightSvc.InsightMetrics))
    const idSvc = yield* $(T.service(IdSvc.IdGenerator))
    const panelId = yield* $(idSvc.nextId("panel"))
    const keys = yield* $(app.getMetricKeys)
    const idx = Math.floor(Math.random() * keys.length)
    const res = keys.at(idx) || (yield* $(TK.gaugeKey))

    return {
      id: panelId,
      key: res
    }
  })

  // A callback to keep track of the current breakpoint
  const updateBreakPoint = (bp: string) =>
    setState((curr) => {
      return {
        breakpoint: bp,
        layouts: curr.layouts,
        content: curr.content
      } as DashboardState
    })

  // A callback to keep track of the current layouts
  const updateLayouts = (layouts: Layouts) =>
    setState((curr) => {
      return {
        breakpoint: curr.breakpoint,
        layouts: layouts,
        content: curr.content
      } as DashboardState
    })

  // A callback to remove a panel from the dashboard by removing it
  // from all layouts and also from the content map
  const removePanel = (panelId: string) => {
    const removeFromLayout = (id: string, l: Layout[]) => {
      return l.slice().filter((c) => c.i != id)
    }

    setState((curr) => {
      const layouts = curr.layouts

      for (const k in layouts) {
        layouts[k] = removeFromLayout(panelId, layouts[k] || [])
      }

      return {
        breakpoint: curr.breakpoint,
        layouts: layouts,
        content: HMap.remove(panelId)(curr.content)
      } as DashboardState
    })
  }

  // A callback to create a panel
  // TODO: Most like this should create a TSConfig and stick that into the underlying
  // panel as an init paramter. That would make the entire dashboard serializable
  const addPanel = () => {
    appRt.unsafeRunAsyncWith(randomKey, (res) => {
      switch (res._tag) {
        case "Failure":
          break
        case "Success":
          setState((curr) => {
            const newPanel = (
              <GridFrame
                key={res.value.id}
                title={res.value.id}
                id={res.value.id}
                closePanel={removePanel}>
                <ChartContainer metricKey={res.value.key} />
              </GridFrame>
            )

            const newLayout: Layout = { i: res.value.id, x: 0, y: 0, w: 3, h: 6 }
            const layouts = curr.layouts
            for (const k in layouts) {
              layouts[k].push(newLayout)
            }

            return {
              breakpoint: curr.breakpoint,
              layouts: layouts,
              content: HMap.set(res.value.id, newPanel)(curr.content)
            } as DashboardState
          })
      }
    })
  }

  const ResponsiveGridLayout = WidthProvider(Responsive)

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
        onBreakpointChange={(bp: string, _: number) => updateBreakPoint(bp)}
        rowHeight={50}>
        {Coll.toArray(dbState.content).map((el) => {
          return (
            <div key={el[0]} className="w-full h-full bg-neutral text-neutral-content">
              {el[1]}
            </div>
          )
        })}
      </ResponsiveGridLayout>
    </div>
  )
}
