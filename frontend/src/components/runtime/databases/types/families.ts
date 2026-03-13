export const FAMILIES = {
  relational: { id: "relational" as const, label: "Relational" },
  analytics:  { id: "analytics"  as const, label: "Analytics"  },
  document:   { id: "document"   as const, label: "Document"   },
  keyvalue:   { id: "keyvalue"   as const, label: "Key-Value"  },
  widecolumn: { id: "widecolumn" as const, label: "Wide-Column" },
  graph:      { id: "graph"      as const, label: "Graph"      },
  search:     { id: "search"     as const, label: "Search"     },
  timeseries: { id: "timeseries" as const, label: "Timeseries" },
} as const;

export type FamilyId   = keyof typeof FAMILIES;
export type FamilyInfo = (typeof FAMILIES)[FamilyId];
