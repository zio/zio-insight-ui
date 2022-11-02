import React from "react"
import * as T from "@effect/core/io/Effect"
import * as Ex from "@effect/core/io/Exit"
import * as FiberId from "@effect/core/io/FiberId"
import * as C from "@core/codecs"
import * as HSet from "@tsplus/stdlib/collections/HashSet"
import * as Coll from "@tsplus/stdlib/collections/Collection"
import * as Chunk from "@tsplus/stdlib/collections/Chunk"
import { getMetricKeys } from "@core/api"

export const MetricKeySelector: React.FC<{}> = (props) => {
  const selectionChanged = (sel: C.MetricKey[]) =>
    console.log(`[${sel.map(C.keyAsString).join(",")}]`)

  return (
    <div className="w-full flex flex-shrink">
      <button
        className={`mx-auto mt-10 py-2.5 px-6 text-white bg-blue-600 rounded uppercase shadow-md`}
        data-bs-toggle="modal"
        data-bs-target="#exampleModal">
        Select Metrics
      </button>
      <div
        className="modal fade fixed top-0 left-0 hidden w-screen h-screen outline-none overflow-x-hidden overflow-y-auto"
        id="exampleModal"
        aria-labelledby="exampleModal"
        aria-hidden="true">
        <div className="max-w-6xl modal-dialog relative pointer-events-none">
          <div className="modal-content border-none shadow-lg relative flex flex-col w-full pointer-events-auto bg-white bg-clip-padding rounded-md outline-none text-current">
            <div className="modal-header flex flex-shrink-0 items-center justify-between p-4 border-b border-gray-200 rounded-t-md">
              <h5
                className="text-xl font-medium leading-normal text-gray-800"
                id="exampleModal">
                Select Metrics ...
              </h5>
              <button
                type="button"
                className="btn-close box-content w-4 h-4 p-1 text-black border-none rounded-none opacity-50 focus:shadow-none focus:outline-none focus:opacity-100 hover:text-black hover:opacity-75 hover:no-underline"
                data-bs-dismiss="modal"
                aria-label="Close"></button>
            </div>
            <div className="modal-body relative p-4 max-h-96 overflow-y-auto">
              <TableMetricKeys
                initialSelection={[]}
                onSelectionChanged={selectionChanged}
              />
            </div>
          </div>
        </div>
      </div>
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
  const [selected, setSelected] = React.useState<HSet.HashSet<C.MetricKey>>(HSet.empty)
  // The available metric keys
  const [items, setItems] = React.useState<C.MetricKey[]>([])

  const isSelected = (k: C.MetricKey) => HSet.has<C.MetricKey>(k)(selected)

  // Get the available keys from the ZIO Application
  React.useEffect(() => {
    const interrupt = T.unsafeRunWith(getMetricKeys, (ex) => {
      if (Ex.isSuccess(ex)) {
        setItems(Coll.toArray(Chunk.toCollection(ex.value)))
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
    <table>
      <thead>
        <th></th>
        <th>Metric Type</th>
        <th>Name</th>
        <th>Labels</th>
      </thead>
      <tbody>
        {items.map((k, _1, _2) => (
          <RowMetricKey
            key={C.keyAsString(k)}
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
  <tr>
    <td>
      <input type="checkbox" onChange={() => props.toggled(props.metricKey)}></input>
    </td>
    <td>{props.metricKey.metricType}</td>
    <td>{props.metricKey.name}</td>
    <td>
      {props.metricKey.labels.map((l) => (
        <span>
          {l.key}={l.value}
        </span>
      ))}
    </td>
  </tr>
)
