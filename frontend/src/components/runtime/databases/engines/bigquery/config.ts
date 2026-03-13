export type BigQueryConfig = {
  projectId: string;
  dataset?: string;
  location?: string;
  useADC: boolean;
  serviceAccountJson?: string;
};
