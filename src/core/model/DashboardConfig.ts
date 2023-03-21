// A Dashboard config is the configuration for an entire Dashboard
// and can be used to (de)serialize a dashboard state to/from local
// storage.

export class PanelLayout {
  constructor(
    readonly id: string,
    readonly x: number,
    readonly y: number,
    readonly w: number,
    readonly h: number
  ) {}
}

export class DashboardConfig {}
