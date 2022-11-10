import * as T from "@effect/core/io/Effect"
import * as S from "@effect/core/stream/Stream"
import * as L from "@effect/core/io/Layer"
import { Tag } from "@tsplus/stdlib/service/Tag"
import { InsightKey } from "@core/metrics/model/MetricKey";
import { MetricState } from "@core/metrics/model/MetricState";

export interface MetricSubscription { 
  id: string,
  data: S.Stream<never, never, MetricState>
}

export interface MetricsManager { 
  subscribe: (key: InsightKey) => T.Effect<never, never, MetricSubscription>
  unsubscribe: (id: string) => T.Effect<never, never, void>
}

const MetricsManager = Tag<MetricsManager>()

const makeMetricsManager = T.succeed(
  <MetricsManager>{
    // create a new subscription for a given InsightKey, the new subscription will have a unique id 
    // that can be used to unsubscribe again
    subscribe: (k: InsightKey) => T.succeed(<MetricSubscription>{ id: k.id, data: S.empty}),
    unsubscribe : (id: string) =>  T.succeed({})
  }
)

export const MetricsManagerLive : L.Layer<never, never, MetricsManager> = 
  L.fromEffect<MetricsManager>(MetricsManager)(makeMetricsManager)

