export type CassandraConfig = {
  hosts: string;
  port: number;
  keyspace: string;
  username?: string;
  password?: string;
  ssl: boolean;
};
