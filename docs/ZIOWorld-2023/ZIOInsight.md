---
marp: true
theme: gaia
--- 

<style>
    section {
        background-color: lightgrey;
    }
    h1 { 
      color: #4422ee;
      text-decoration: underline;
    }
</style>

# ZIO Insight Preview
## Andreas Gies, ZIO Team
## ZIO World 2023

--- 

# ZIO Insight Server 

## Instrumentation for ZIO 2 applications 
- Ready to go ZIO Http Server with ZIO Insight routes
  - Expose ZIO metrics from a ZIO Metrics Connectors endpoint
  - Expose Fiber infos collected by a ZIO Insight Supervisor

- Adaptable for other HTTP server implementations 

--- 

# ZIO Insight UI

- Single Page Application based on Effect, a ZIO inspired Effect system in Typescript
- Simple Dashboarding
- Metrics Dashboard based on Chart.JS for metrics visualization
- Force graph simulation for Fiber hierarchies with filtering and access to Fiber Stacktraces


--- 

# A small sample program 

```scala
  val program = for {
    _ <- gaugeSomething.schedule(Schedule.spaced(500.millis).jittered).forkScoped
    _ <- observeNumbers.schedule(Schedule.spaced(400.millis).jittered).forkScoped
    _ <- observeKey.schedule(Schedule.spaced(300.millis).jittered).forkScoped
    _ <- doSomething.catchAll(_ => ZIO.unit).schedule(Schedule.spaced(200.millis).jittered).forkScoped
    _ <- FiberTree.run(2, 3, 3).forever.forkScoped
  } yield ()
```

---

# Providing the ZIO Insight Services

```scala
    (for {
      f <- ZIO.never.forkScoped
      _ <- program
      _ <- Server.serve[InsightPublisher with FiberEndpoint](InsightServer.routes)
      _ <- Console.printLine("Started Insight Sample application ...")
      _ <- f.join
    } yield ())
      .provideSome[Scope](
        ZLayer.succeed(ServerConfig.default.port(8080)),
        Server.live,
        // Update Metric State for the API endpoint every 5 seconds
        ZLayer.succeed(MetricsConfig(5.seconds)),
        insight.metricsLayer,
        // Enable the ZIO internal metrics and the default JVM metricsConfig
        Runtime.enableRuntimeMetrics,
        Runtime.enableFiberRoots,
        DefaultJvmMetrics.live.unit,
        FiberEndpoint.live,
        ZLayer.succeed(
          fiberSupervisor,
        ),                    // Required to give the HTTP endpoint access to the data collected by the supervisor
        fiberSupervisor.layer,// maintain the supervisors data, i.e. remove stats for terminated fibers after a threshold time
      )
      .supervised(fiberSupervisor)
```

--- 

# Live Demo 

--- 

# Resources

- https://zio.dev/
  Documentation for all ZIO 2 modules and libraries
- https://effect.website/docs/getting-started 
  Website for Effect, the ZIO inspired Effect system in Typescript
- https://www.chartjs.org/
  The Charting library used to render the metrics
- https://d3js.org/
  A powerful visualization framework for large data sets
- https://react.dev/learn
  The React documentation 
- https://mui.com/
  Material UI is currently used as a component library for the UI

---

# Thank you 

## Check out the source code on GitHub 
- ZIO Insight UI :  https://github.com/zio/zio-insight-ui
- ZIO Insight Server : https://github.com/zio/zio-insight-server
- __atooni__ on Discord and Github 
- __@andreasgies__ on Twitter
- Join the Discord Servers : 
  - https://discord.gg/cUkQdZn8 for information around ZIO 
  - https://discord.gg/effect-ts for more information about Effect used in the front-end
