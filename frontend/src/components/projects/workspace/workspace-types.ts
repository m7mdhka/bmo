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

