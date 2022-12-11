import * as React from "react"
import * as T from "@effect/core/io/Effect"
import * as App from "@components/App"
import * as HS from "@tsplus/stdlib/collections/HashSet"
import * as Ex from "@effect/core/io/Exit"
import * as FiberId from "@effect/core/io/FiberId"
import * as Insight from "@core/metrics/services/InsightService"
import { TableMetricKeys } from "@components/TableMetricKey"
import { Scrollable } from "./Scrollable"
import { InsightKey } from "@core/metrics/model/zio/MetricKey"
import * as GDM from "@core/metrics/services/GraphDataManager"
import { pipe } from "@tsplus/stdlib/data/Function"
import * as Coll from "@tsplus/stdlib/collections/Collection"

export interface ChartConfigPanelProps {
  id: string
  onDone: (_: string) => void
}

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)

  const closeHandler = () => {
    props.onDone(props.id)
  }

  const [available, setAvailable] = React.useState<InsightKey[]>([])
  const [selected, setSelected] = React.useState<InsightKey[]>([])

  const availableKeys = pipe(
    Insight.getMetricKeys,
    T.catchAll((_) => T.sync(() => [] as InsightKey[]))
  )

  const applySelection = () => {
    appRt
      .unsafeRunPromise(
        T.gen(function* ($) {
          const gdm = yield* $(T.service(GDM.GraphDataManager))
          yield* $(
            pipe(
              gdm.lookup(props.id),
              T.flatMap((svc) => svc.setMetrics(...selected)),
              T.catchAll((_) => T.sync(() => {}))
            )
          )
        })
      )
      .then((_) => closeHandler())
  }

  const initialSelection = T.gen(function* ($) {
    const gdm = yield* $(T.service(GDM.GraphDataManager))
    const keys = yield* $(
      pipe(
        gdm.lookup(props.id),
        T.flatMap((svc) => svc.metrics()),
        T.catchAll((_) => T.sync(() => HS.empty<InsightKey>())),
        T.map(Coll.toArray)
      )
    )
    return keys
  })

  React.useEffect(() => {
    const run = appRt.unsafeRunWith(
      pipe(availableKeys, T.zip(initialSelection)),
      (e) => {
        if (Ex.isSuccess(e)) {
          const [allKeys, selection] = e.value
          setAvailable(allKeys)
          setSelected(selection)
        } else {
          console.log(e.cause)
        }

        return () => {
          try {
            run(FiberId.none)((_) => {})
          } catch {}
        }
      }
    )
  }, [props.id])

  const updateSelected = (k: InsightKey) =>
    setSelected((curr) => {
      const newSelection = (() => {
        if (curr.find((e) => e.id == k.id)) {
          return curr.filter((e) => e.id != k.id)
        } else {
          const s = curr.slice()
          s.push(k)
          return s
        }
      })()

      return newSelection
    })

  return (
    <div className="w-full h-full flex flex-col justify-items-stretch">
      <div className="flex flex-col mb-2">
        <div className="flex flex-row">
          <input type="text" />
          <input type="text" />
        </div>
        <div className="flex flex-row">
          <input type="text" />
        </div>
      </div>
      <Scrollable>
        <TableMetricKeys
          available={available}
          selection={selected}
          onSelect={updateSelected}></TableMetricKeys>
      </Scrollable>
      <div className="m-2 flex-none flex flex-row justify-end">
        <span className="btn btn-neutral" onClick={closeHandler}>
          Discard Changes
        </span>
        <span
          className={`ml-2 btn ${selected.length > 0 ? "btn-primary" : "btn-disabled"}`}
          onClick={applySelection}>
          {selected.length > 0 ? "Apply Changes" : "Nothing Selected"}
        </span>
      </div>
    </div>
  )
}
