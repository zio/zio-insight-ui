import * as Cfg from "@core/metrics/services/DashboardManager"

describe("Dashboard Config", () => {
  it("should log", () => {
    const xx = new Cfg.MetricsConfig()
    console.log(`${JSON.stringify(xx._tag, null, 2)}`)
  })
})
