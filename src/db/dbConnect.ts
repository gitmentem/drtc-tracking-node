import mysql, { type Connection } from "mysql2/promise";
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
    password: "123456",
  };

  private configs = {
    prod: {
      db: { ...this.prodConfig, database: process.env.DB_NAME },
    },
    local: {
      db: { ...this.localConfig, database: "drtc" },
    },
  };

  async connect(): Promise<Connection> {
    return mysql.createConnection(this.configs[this.environment].db);
  }
}

export const DB_MODE  = "prod";
export const db = new DatabaseConnection(DB_MODE); // or "prod"
