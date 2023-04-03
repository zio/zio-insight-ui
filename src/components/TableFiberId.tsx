import * as HS from "@effect/data/HashSet"
import React from "react"

import * as FiberId from "@core/metrics/model/insight/fibers/FiberId"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableFiberIdProps {
  available: HS.HashSet<FiberId.FiberId>
  // The initially selected keys
  selection: HS.HashSet<FiberId.FiberId>
  // a Callback that can be used to change the selection state
  onSelect: (key: FiberId.FiberId) => void
}

export const TableFiberIds: React.FC<TableFiberIdProps> = (props) => {
  const sorted = [...props.available].sort((a, b) => FiberId.OrdFiberId.compare(a, b))

  const isSelected =
    (k: FiberId.FiberId) => (selection: HS.HashSet<FiberId.FiberId>) => {
      return HS.some(selection, (e) => e.id == k.id)
    }

  return (
    <>
      <table className="table table-zebra table-compact w-full">
        <thead>
          <tr>
            <th></th>
            <th>FiberId</th>
            <th>Started At</th>
            <th>Location</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((k) => (
            <RowMetricKey
              key={k.id}
              fiberId={k}
              checked={isSelected(k)(props.selection)}
              toggled={() => props.onSelect(k)}
            />
          ))}
        </tbody>
      </table>
    </>
  )
}

interface RowFiberIdProps {
  fiberId: FiberId.FiberId
  checked: boolean
  toggled: (k: FiberId.FiberId) => void
}

const RowMetricKey: React.FC<RowFiberIdProps> = (props) => (
  <tr className="hover">
    <td>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={() => {
          props.toggled(props.fiberId)
        }}
      ></input>
    </td>
    <td>{props.fiberId.id}</td>
    <td>{props.fiberId.startTimeMillis}</td>
    <td>{FiberId.formatLocation(props.fiberId.location)}</td>
  </tr>
)
