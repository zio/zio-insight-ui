import * as Effect from "@effect/io/Effect"
import type * as d3 from "d3"

export interface GraphNode<T> extends d3.SimulationNodeDatum {
  data: T
}

export interface GraphLink<T> extends d3.SimulationLinkDatum<GraphNode<T>> {
  source: GraphNode<T>
  target: GraphNode<T>
}

export interface Graph<T> {
  // The current nodes of the graph
  readonly nodes: Effect.Effect<never, never, GraphNode<T>[]>
  // The current set of nodes the graph
  readonly links: Effect.Effect<never, never, GraphLink<T>[]>

  // how to access the id of a single node
  idAccessor: (_: T) => number

  // add or replace a node within the graph
  readonly putNode: (node: T) => Effect.Effect<never, never, void>

  // remove a node from the graph
  readonly removeNode: (node: T) => Effect.Effect<never, never, void>

  // add a link between two nodes
  readonly link: (source: T) => (target: T) => Effect.Effect<never, never, void>

  readonly unlink: (source: T) => (target: T) => Effect.Effect<never, never, void>
}

export function empty<T>(): Graph<T> {
  return {
    nodes: Effect.succeed([]),
    links: Effect.succeed([]),
    idAccessor: (_: T) => 0,
    putNode: (node: T) => Effect.unit(),
    removeNode: (node: T) => Effect.unit(),
    link: (source: T) => (target: T) => Effect.unit(),
    unlink: (source: T) => (target: T) => Effect.unit(),
  }
}
