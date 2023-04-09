import * as App from "@components/app/App"
import { ContentBox } from "@components/contentbox/ContentBox"
import { TableMetricKeys } from "@components/tablemetrickey/TableMetricKey"
import { useInsightTheme } from "@components/theme/InsightTheme"
import { pipe } from "@effect/data/Function"
import * as HashSet from "@effect/data/HashSet"
import * as Option from "@effect/data/Option"
import * as Effect from "@effect/io/Effect"
import * as Exit from "@effect/io/Exit"
import * as Runtime from "@effect/io/Runtime"
import { Box, Button } from "@mui/material"
import * as React from "react"

import type { InsightKey } from "@core/metrics/model/zio/metrics/MetricKey"
import * as GDM from "@core/metrics/services/GraphDataManager"
import * as Insight from "@core/metrics/services/InsightService"

export interface ChartConfigPanelProps {
  id: Option.Option<string>
  onDone: (_: string) => void
}

export const ChartConfigPanel: React.FC<ChartConfigPanelProps> = (props) => {
  const appRt = React.useContext(App.RuntimeContext)
  const theme = useInsightTheme()

  const closeHandler = (id: string) => () => {
    props.onDone(id)
  }

  const [available, setAvailable] = React.useState<HashSet.HashSet<InsightKey>>(
    HashSet.empty
  )
  const [selected, setSelected] = React.useState<HashSet.HashSet<InsightKey>>(
    HashSet.empty
  )

  const availableKeys = pipe(
    Insight.getMetricKeys,
    Effect.catchAll((_) => Effect.succeed(HashSet.empty<InsightKey>()))
  )

  const applySelection = (id: string) => () => {
    Runtime.runPromise(appRt)(
      Effect.gen(function* ($) {
        const gdm = yield* $(GDM.GraphDataManager)
        yield* $(
          pipe(
            gdm.lookup(id),
            Effect.flatMap((svc) => svc.setMetrics(selected)),
            Effect.catchAll((_) =>
              Effect.sync(() => {
                /* ignore */
              })
            )
          )
        )
      })
    ).then((_) => closeHandler(id)())
  }

  const initialSelection = Effect.gen(function* ($) {
    const keysById = (id: string) =>
      pipe(
        gdm.lookup(id),
        Effect.flatMap((svc) => svc.metrics()),
        Effect.catchAll((_) => Effect.succeed(HashSet.empty<InsightKey>()))
      )

    const gdm = yield* $(GDM.GraphDataManager)
    switch (props.id._tag) {
      case "None":
        return HashSet.empty<InsightKey>()
      case "Some":
        return yield* $(keysById(props.id.value))
    }
  })

  React.useEffect(() => {
    Runtime.runCallback(appRt)(
      pipe(availableKeys, Effect.zip(initialSelection)),
      (e) => {
        if (Exit.isSuccess(e)) {
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
      }
    )
  }, [props.id])

  const updateSelected = (k: InsightKey) =>
    setSelected((curr) => {
      const newSelection = (() => {
        if (HashSet.some(curr, (e) => e.id == k.id)) {
          return HashSet.filter(curr, (e) => e.id != k.id)
        } else {
          return HashSet.add(curr, k)
        }
      })()

      return newSelection
    })

  const confirmSelection = () => {
    const mbBox = Option.map(props.id, (id) => {
      return (
        <Box
          sx={{
            padding: `${theme.padding.small}px`,
            flexGrow: 0,
            display: "flex",
            flexDirection: "row",
          }}
        >
          <Button variant="contained" color="secondary" onClick={closeHandler(id)}>
            Discard Changes
          </Button>
          <Button
            variant="contained"
            color="secondary"
            disabled={HashSet.size(selected) == 0}
            onClick={applySelection(id)}
          >
            Apply Changes
          </Button>
        </Box>
      )
    })

    return Option.getOrElse(mbBox, () => <> </>)
  }

  return (
    <ContentBox>
      <Box
        sx={{
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
      {confirmSelection()}
    </ContentBox>
  )
}
