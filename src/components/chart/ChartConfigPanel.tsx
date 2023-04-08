import * as App from "@components/app/App"
import { ContentBox } from "@components/contentbox/ContentBox"
import { TableMetricKeys } from "@components/tablemetrickey/TableMetricKey"
import { pipe } from "@effect/data/Function"
import * as HS from "@effect/data/HashSet"
import * as T from "@effect/io/Effect"
import * as Ex from "@effect/io/Exit"
import * as RT from "@effect/io/Runtime"
import { Box } from "@mui/material"
import * as React from "react"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import * as GDM from "@core/metrics/services/GraphDataManager"
import * as Insight from "@core/metrics/services/InsightService"

export interface ChartConfigPanelProps {
  id: string
  onDone: (_: string) => void
}

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)

  const closeHandler = () => {
    props.onDone(props.id)
  }

  const [available, setAvailable] = React.useState<HS.HashSet<InsightKey>>(HS.empty)
  const [selected, setSelected] = React.useState<HS.HashSet<InsightKey>>(HS.empty)

  const availableKeys = pipe(
    Insight.getMetricKeys,
    T.catchAll((_) => T.succeed(HS.empty<InsightKey>()))
  )

  const applySelection = () => {
    RT.runPromise(appRt)(
      T.gen(function* ($) {
        const gdm = yield* $(GDM.GraphDataManager)
        yield* $(
          pipe(
            gdm.lookup(props.id),
            T.flatMap((svc) => svc.setMetrics(selected)),
            T.catchAll((_) =>
              T.sync(() => {
                /* ignore */
              })
            )
          )
        )
      })
    ).then((_) => closeHandler())
  }

  const initialSelection = T.gen(function* ($) {
    const gdm = yield* $(GDM.GraphDataManager)
    const keys = yield* $(
      pipe(
        gdm.lookup(props.id),
        T.flatMap((svc) => svc.metrics()),
        T.catchAll((_) => T.sync(() => HS.empty<InsightKey>()))
      )
    )
    return keys
  })

  React.useEffect(() => {
    RT.runCallback(appRt)(pipe(availableKeys, T.zip(initialSelection)), (e) => {
      if (Ex.isSuccess(e)) {
        const [allKeys, selection] = e.value
        setAvailable(allKeys)
        setSelected(selection)
      } else {
        console.log(e.cause)
      }

      return () => {
        try {
          /* ignore */
        } catch {
          /* ignore */
        }
      }
    })
  }, [props.id])

  const updateSelected = (k: InsightKey) =>
    setSelected((curr) => {
      const newSelection = (() => {
        if (HS.some(curr, (e) => e.id == k.id)) {
          return HS.filter(curr, (e) => e.id != k.id)
        } else {
          return HS.add(curr, k)
        }
      })()

      return newSelection
    })

  return (
    <ContentBox
      sx={{
        border: "1px solid #000",
      }}
    >
      <Box
        sx={{
          padding: "10px",
          flex: "1 1 auto",
          overflow: "auto",
        }}
      >
        <TableMetricKeys
          available={available}
          selection={selected}
          onSelect={updateSelected}
        ></TableMetricKeys>
      </Box>
    </ContentBox>
    // <div className="w-full h-full flex flex-col justify-items-stretch">
    //   <div className="flex flex-col mb-2">
    //     <div className="flex flex-row">
    //       <input type="text" />
    //       <input type="text" />
    //     </div>
    //     <div className="flex flex-row">
    //       <input type="text" />
    //     </div>
    //   </div>
    //   <Scrollable>
    //     <TableMetricKeys
    //       available={available}
    //       selection={selected}
    //       onSelect={updateSelected}
    //     ></TableMetricKeys>
    //   </Scrollable>
    //   <div className="m-2 flex-none flex flex-row justify-end">
    //     <span className="btn btn-neutral" onClick={closeHandler}>
    //       Discard Changes
    //     </span>
    //     <span
    //       className={`ml-2 btn ${
    //         HS.size(selected) > 0 ? "btn-primary" : "btn-disabled"
    //       }`}
    //       onClick={applySelection}
    //     >
    //       {HS.size(selected) > 0 ? "Apply Changes" : "Nothing Selected"}
    //     </span>
    //   </div>
    // </div>
  )
}
