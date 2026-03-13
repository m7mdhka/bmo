export const GROUPS = {
  sql:        "SQL",
  analytics:  "Analytics",
  document:   "Document",
  keyvalue:   "Key-Value",
  widecolumn: "Wide-Column",
  graph:      "Graph",
  search:     "Search",
  timeseries: "Timeseries",
} as const;

export type GroupKey   = keyof typeof GROUPS;
export type GroupLabel = (typeof GROUPS)[GroupKey];
