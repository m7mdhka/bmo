export type FirestoreConfig = {
  projectId: string;
  authMode: "applicationDefault" | "serviceAccountJson";
  serviceAccountJson?: string;
};
