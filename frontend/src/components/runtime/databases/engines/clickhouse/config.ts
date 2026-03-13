export type ClickHouseConfig = {
  host: string;
  port: number;
  database: string;
  secure: boolean;
  username?: string;
  password?: string;
};
