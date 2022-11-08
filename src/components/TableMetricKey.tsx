import React from "react"
import * as Ex from "@effect/core/io/Exit"
import * as FiberId from "@effect/core/io/FiberId"
import * as C from "@core/metrics/model/MetricState"
import * as HSet from "@tsplus/stdlib/collections/HashSet"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import { RuntimeContext } from "./App"
import { getMetricKeys } from "@core/api"

export const MetricKeySelector: React.FC<{}> = (props) => {
  const selectionChanged = (sel: C.MetricKey[]) =>
    console.log(`[${sel.map(C.keyAsString).join(",")}]`)

  return (
    <div className="w-full flex flex-shrink dark">
      <label htmlFor="exampleModal" className="btn btn-primary">
        Select Metrics
      </label>
      <input type="checkbox" id="exampleModal" className="modal-toggle" />
      <label htmlFor="exampleModal" className="modal cursor-pointer">
        <div className="max-h-96 overflow-y-auto rounded p-2">
          <TableMetricKeys
            initialSelection={[]}
            onSelectionChanged={selectionChanged}
          />
        </div>
      </label>
    </div>
  )
}

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableMetricKeysProps {
  // The initially selected keys
  initialSelection: C.MetricKey[]
  // a Callback that can be used to change the selection state
  onSelectionChanged: (key: C.MetricKey[]) => void
}

export const TableMetricKeys: React.FC<TableMetricKeysProps> = (props) => {
  const appRt = React.useContext(RuntimeContext)

  const [selected, setSelected] = React.useState<HSet.HashSet<C.MetricKey>>(HSet.empty)
  // The available metric keys
  const [items, setItems] = React.useState<C.MetricKey[]>([])

  const isSelected = (k: C.MetricKey) => HSet.has<C.MetricKey>(k)(selected)

  // Get the available keys from the ZIO Application
  React.useEffect(() => {
    const interrupt = appRt.unsafeRunWith(getMetricKeys, (ex) => {
      if (Ex.isSuccess(ex)) {
        setItems(ex.value)
      } else {
        console.error(ex.cause)
      }
    })

    return () => interrupt(FiberId.none)((_) => {})
  }, [])

  const toggleKey = (k: C.MetricKey) => {
    if (isSelected(k)) {
      return HSet.remove(k)(selected)
    } else {
      return HSet.add(k)(selected)
    }
  }

  const toggled = (k: C.MetricKey) => {
    const newSelection = toggleKey(k)
    props.onSelectionChanged(Coll.toArray(HSet.toCollection(newSelection)))
    setSelected(newSelection)
  }

  return (
    <table className="table table-zebra table-compact">
      <thead>
        <tr>
          <th></th>
          <th>Metric Type</th>
          <th>Name</th>
          <th>Labels</th>
        </tr>
      </thead>
      <tbody>
        {items.map((k, _1, _2) => (
          <RowMetricKey
            key={k.id}
            metricKey={k}
            checked={isSelected(k)}
            toggled={toggled}
          />
        ))}
      </tbody>
    </table>
  )
}

interface RowMetricKeyProps {
  metricKey: C.MetricKey
  checked: boolean
  toggled: (k: C.MetricKey) => void
}

const RowMetricKey: React.FC<RowMetricKeyProps> = (props) => (
  <tr className="hover">
    <td>
      <input type="checkbox" onChange={() => props.toggled(props.metricKey)}></input>
    </td>
    <td>{props.metricKey.key.metricType}</td>
    <td>{props.metricKey.key.name}</td>
    <td>
      {props.metricKey.key.labels.map((l) => (
        <span className="badge" key={l.key}>
          {l.key}={l.value}
        </span>
      ))}
    </td>
  </tr>
)
