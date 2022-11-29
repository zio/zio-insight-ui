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
import { InsightKey } from "@core/metrics/model/zio/MetricKey"

interface DashboardState {
  breakpoint: string
  layouts: Layouts
  content: HMap.HashMap<string, React.ReactElement>
}

export function InsightGridLayout() {
  const appRt = React.useContext(App.RuntimeContext)

  const [dbState, setState] = React.useState<DashboardState>({
    breakpoint: "md",
    layouts: {
      md: [],
      lg: []
    },
    content: HMap.empty()
  } as DashboardState)

  const randomKey = T.gen(function* ($) {
    const app = yield* $(T.service(InsightSvc.InsightMetrics))
    const idSvc = yield* $(T.service(IdSvc.IdGenerator))
    const panelId = yield* $(idSvc.nextId("panel"))
    const keys = yield* $(app.getMetricKeys)
    const idx = Math.floor(Math.random() * keys.length)
    const res = keys.at(idx) || (yield* $(TK.gaugeKey))

    console.log(res.id)
    return [panelId, res] as [string, InsightKey]
  })

  const updateBreakPoint = (bp: string) =>
    setState((curr) => {
      return {
        breakpoint: bp,
        layouts: curr.layouts,
        content: curr.content
      } as DashboardState
    })

  const updateLayouts = (layouts: Layouts) =>
    setState((curr) => {
      return {
        breakpoint: curr.breakpoint,
        layouts: layouts,
        content: curr.content
      } as DashboardState
    })

  const addPanel = () => {
    appRt.unsafeRunAsyncWith(randomKey, (res) => {
      switch (res._tag) {
        case "Failure":
          break
        case "Success":
          setState((curr) => {
            const newPanel = (
              <GridFrame key={res.value[0]} title={res.value[0]}>
                <ChartContainer metricKey={res.value[1]} />
              </GridFrame>
            )

            const newLayout: Layout = { i: res.value[0], x: 0, y: 0, w: 3, h: 3 }
            const layouts = curr.layouts
            for (const k in layouts) {
              layouts[k].push(newLayout)
            }

            return {
              breakpoint: curr.breakpoint,
              layouts: layouts,
              content: HMap.set(res.value[0], newPanel)(curr.content)
            } as DashboardState
          })
      }
    })
  }

  const ResponsiveGridLayout = WidthProvider(Responsive)

  // This is required to push resize events, so that embedded Vega Lite charts
  // trigger their own resizing as well
  const handleResize = () => window.dispatchEvent(new Event("resize"))

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
        onResize={handleResize}
        onBreakpointChange={(bp: string, _: number) => updateBreakPoint(bp)}
        onLayoutChange={(_: Layout[], all: Layouts) => updateLayouts(all)}
        onResizeStop={() => setTimeout(handleResize, 200)}
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
