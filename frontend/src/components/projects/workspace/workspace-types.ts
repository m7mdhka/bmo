export type FileNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  language?: string;
  content?: string;
  children?: FileNode[];
};

export type OpenFile = {
  id: string;
  title: string;
  language?: string;
  content: string;
};

export type ProjectRuntimeService = {
  name: string;
  status: "running" | "stopped";
  role: "workspace" | "frontend" | "backend" | "service";
  label: string;
};

export type ProjectRuntimeInfo = {
  projectStatus: "running" | "stopped";
  services: ProjectRuntimeService[];
  defaultTerminalService: string | null;
  previewService: string | null;
};
