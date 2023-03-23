// A Content manager abstracts the mapping of a configuration to
// a content panel and an optional configuration panel.

// For example, a ChartPanel renders one or more lines within
// a line chart. Hereby each line corresponds to a unique key
// that is composed of the actual Metric Key and in case of a
// Metric group (Summary, Histogram or Frequency) a subkey.
// For each of those keys, the config object has to specify
// the line color, the point color, the line transparency
// and other visual properties.

// In this example the content manager will return a panel
// with the actual chart as the content panel and a config
// panel to edit the configuration of the chart.

// Furthermore the Config Manager exposes an API to register
// new types of configurations. To create a content panel,
// the content manager will iterate over all registered
// config types. The first function that does not yield an
// error will be used to create the panel content and
// config panels.

export interface ContentManager {}
