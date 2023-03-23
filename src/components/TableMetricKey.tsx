import * as HS from "@effect/data/HashSet"
import React from "react"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"

/**
 * A component for rendering available metric keys in a table. Effectively this
 */
interface TableMetricKeysProps {
  available: HS.HashSet<InsightKey>
  // The initially selected keys
  selection: HS.HashSet<InsightKey>
  // a Callback that can be used to change the selection state
  onSelect: (key: InsightKey) => void
}

export const TableMetricKeys: React.FC<TableMetricKeysProps> = (props) => {
  const isSelected = (k: InsightKey) => (selection: HS.HashSet<InsightKey>) => {
    return HS.some(selection, (e) => e.id == k.id)
  }

  return (
    <>
      <table className="table table-zebra table-compact w-full">
        <thead>
          <tr>
            <th></th>
            <th>Metric Type</th>
            <th>Name</th>
            <th>Labels</th>
          </tr>
        </thead>
        <tbody>
          {HS.map(props.available, (k) => (
            <RowMetricKey
              key={k.id}
              metricKey={k}
              checked={isSelected(k)(props.selection)}
              toggled={() => props.onSelect(k)}
            />
          ))}
        </tbody>
      </table>
    </>
  )
}

interface RowMetricKeyProps {
  metricKey: InsightKey
  checked: boolean
  toggled: (k: InsightKey) => void
}

const RowMetricKey: React.FC<RowMetricKeyProps> = (props) => (
  <tr className="hover">
    <td>
      <input
        type="checkbox"
        checked={props.checked}
        onChange={() => {
          props.toggled(props.metricKey)
        }}
      ></input>
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
