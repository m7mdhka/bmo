export type SearchConfig = {
  url: string;
  authMode: "none" | "basic" | "apiKey";
  username?: string;
  password?: string;
  apiKey?: string;
};
