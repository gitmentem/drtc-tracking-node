import mysql, { Connection } from "mysql2/promise";
import { config } from "dotenv";
config();

class DatabaseConnection {
  private environment: "local" | "prod";

  constructor(environment: "local" | "prod") {
    this.environment = environment;
  }

  private prodConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectTimeout:20000,
    dateStrings: true // so that when querying the db i will get 0000-00-00 as date string not date object
  };

  private localConfig = {
    host: "localhost",
    user: "root",
    password: "",
  };

  private configs = {
    prod: {
      db: { ...this.prodConfig, database: "drtcstock" },
    },
    local: {
      db: { ...this.localConfig, database: "drtcstock" },
    },
  };

  async Db(): Promise<Connection> {
    return mysql.createConnection(this.configs[this.environment].db);
  }
}

export const DB_MODE  = "prod";
export const db = new DatabaseConnection(DB_MODE); // or "prod"
