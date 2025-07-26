import mysql, { type Connection } from "mysql2/promise";
import { config } from "dotenv";
config();

class DatabaseConnection {
  private IBMServerConfig = {
    host: process.env.IBMSERVER_HOST,
    user: process.env.IBMSERVER_USER,
    password: process.env.IBMSERVER_PASSWORD,
    connectTimeout:20000,
    dateStrings: true // so that when querying the db i will get 0000-00-00 as date string not date object
  };

  private localConfig = {
    host: "localhost",
    user: "root",
    password: "123456",
  };

  private drtcIndiaConfig = {
    host: process.env.DRTCINDIA_HOST,
    user: process.env.DRTCINDIA_USER,
    password: process.env.DRTCINDIA_PASSWORD,
  };

  private configs = {
    ibmserver: {
      db: { ...this.IBMServerConfig, database: process.env.IBMSERVER_DBNAME },
    },
    local: {
      db: { ...this.localConfig, database: "drtc" },
    },
    drtcindia: {
      db: { ...this.drtcIndiaConfig, database: process.env.DRTCINDIA_DBNAME },
    },
  };

  async connect(environment: "ibmserver" | "local" | "drtcindia"): Promise<Connection> {
    return mysql.createConnection(this.configs[environment].db);
  }
}

export const db = new DatabaseConnection();
