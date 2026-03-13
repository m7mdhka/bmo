export type RedisConfig = {
  host: string;
  port: number;
  db?: number;
  username?: string;
  password?: string;
  tls: boolean;
};
