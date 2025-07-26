import mysql from "mysql2/promise";
import * as path from 'path';
import * as fs from 'fs';
import { db } from "@/db/dbConnect.js";
import { DB_PREFIX } from "./constants.js";
import { config } from "dotenv";
config();

const isDev = process.env.NODE_ENV !== 'production';

export const log = (...args: any[]) => {
  if (isDev) {
    console.log('[LOG]', ...args);
  }
};

export  function logQuery(psql:string , pvalues?:any[], pshouldconsole: boolean = true):void {
    let formattedQuery;
    if (pvalues && pvalues.length > 0) {
        formattedQuery = mysql.format(psql, pvalues);
      } else {
        formattedQuery = psql; // No formatting needed if no values are provided
    }
    const timestamp = new Date().toLocaleString();
    // const logEntry = `[${timestamp}] Executing query: ${formattedQuery}\n--------------------------------\n`;

    // const logFilePath = path.join(__dirname, 'query-logs.txt');
    // fs.appendFile(logFilePath, logEntry, (err) => {
    //   if (err) {
    //     console.error('Failed to write to log file:', err);
    //   }
    // });
    if(pshouldconsole){
      console.log('Executing query:', formattedQuery);
    }
}

export function formatDateDMY(pdate: any) {
    return new Date(pdate).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });
}
export function ucwords(str: string): string {
    return str.toLowerCase()
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    // ! wont work on this usecase :ucwords(hello-world)
}

export async function GetBranchDBName_BranchId_Web(branchid: string, connection: mysql.Connection): Promise<string> {
    let sql = "select pbranchcode from subbranchtable where branchid = ?";
    let values  = [branchid];

    try {
        logQuery(sql, values);
        const [rows]: any = await connection.query(sql, values)
        
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error(`No branch found for branchid: ${branchid}`);
        }
        
        const row = rows[0] as any;
        const dbname = DB_PREFIX + row.pbranchcode.toLowerCase();
        
        return dbname;
    } catch (error) {
        console.error('Error in GetBranchDBName_BranchId_Web Function:', error);
        throw error;
    }
}

export async function GetBranchDBName_Web(branchcode: string, connection: mysql.Connection): Promise<string> {
    let sql = "select pbranchcode from subbranchtable where branchcode = ?";
    let values  = [branchcode];
    

    try {
        logQuery(sql, values);
        const [rows]: any = await connection.query(sql, values)
        console.log("rows::",rows);
        
        if (!Array.isArray(rows) || rows.length === 0) {
            throw new Error(`No branch found for branchcode: ${branchcode}`);
        }
        
        const row = rows[0] as any;
        const dbname = DB_PREFIX + row["pbranchcode"].toLowerCase();
        
        return dbname;
    } catch (error) {
        console.error('Error in GetBranchDBName_Web Function:', error);
        throw error;
    }
}

export function getFullDocumentNo(tmpsourcebranchcode: string, tmpsourcebranchid: string, tmpdocno: string): string {
    log("tmpsourcebranchcode::", tmpsourcebranchcode);
    log("tmpsourcebranchid::",  tmpsourcebranchid);
    log("tmpdocno::", tmpdocno);
    
    const tmpstr = tmpsourcebranchcode + "/" + String(tmpsourcebranchid).padStart(2, "0") + "/" + 
    String(tmpdocno).padStart(7, " ");
    return tmpstr;
}

async function GetValuefromDb<T = any>(
    tablename: string, 
    idfldname: string, 
    fldname: string, 
    idfldvalue: string | number,
    connection?: mysql.Connection
): Promise<T | null> {

    const sql = `select ${fldname} from ${tablename} where ${idfldname} = ?`;
    let values = [idfldvalue]
    try {
        if(!connection){
            // ! return some error message
            return null;
        }

        logQuery(sql, values);
        const [rows]: any = await connection.query(sql, values);
        
        if (!Array.isArray(rows) || rows.length === 0) {
            return null;
        }
        
        const row = rows[0] as any;
        return row[fldname] as T;
    } catch (error) {
        console.error('Database query error:', error);
        console.error('SQL:', sql);
        throw error;
    }
}

export function date(
    format: string, 
    timestamp: number = Math.floor(Date.now() / 1000)
): string {
  const date = new Date(timestamp * 1000); 
  const map: { [key: string]: string | number } = {
    Y: date.getFullYear(),
    m: String(date.getMonth() + 1).padStart(2, '0'),
    d: String(date.getDate()).padStart(2, '0'),
    H: String(date.getHours()).padStart(2, '0'),
    i: String(date.getMinutes()).padStart(2, '0'),
    s: String(date.getSeconds()).padStart(2, '0'),
  };

  return format.replace(/Y|m|d|H|i|s/g, (match: string) => String(map[match]))
}

export function add12MonthsToDate(biltydate: string): string {
  const originalDate = new Date(biltydate);

  // Create a new date to avoid mutating originalDate
  const modifiedDate = new Date(originalDate);
  modifiedDate.setMonth(modifiedDate.getMonth() + 12);

  // Format to YYYY-MM-DD
  const year = modifiedDate.getFullYear();
  const month = String(modifiedDate.getMonth() + 1).padStart(2, '0');
  const day = String(modifiedDate.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Example:
const biltydate = "2023-07-26";
const biltydate_modified = add12MonthsToDate(biltydate);
console.log(biltydate_modified); // "2024-07-26"
