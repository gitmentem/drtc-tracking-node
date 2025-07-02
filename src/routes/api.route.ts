import { Router } from "express";
import { TryCatch } from "@/middlewares/error";
import { Request, Response, NextFunction } from "express";
import { db } from "@/db/dbConnect";
import { formatDateDMY, GetBranchDBName_Web, getFullDocumentNo, logQuery, ucwords } from "@/utils/commonFunctions";
import { ApiResponse, IDetailsLine } from "@/types/response.type";

const router = Router();

router.get("/db-test", async(req:Request, res:Response)=>{
  const connection  = await db.Db();
  let sql = `select branchname from branchmaster where branchid = 995`
  const [rows]: any = await connection.query(sql)
  console.log("rows::",rows);
  
  res.send("working")
})

router.post(
  "/track", TryCatch(async (
      req: Request<{},{},{ sourcebranchcode: string; biltystateno: string; biltyno: string }>,
      res: Response,
      next: NextFunction
    ) => {
      let sql;
      let values;
      let apiresponse = {} as ApiResponse;
      let connection = await db.Db();
      
      let biltynofull;
      let biltydate;
      let details: Array<IDetailsLine> = [];
      let details_line = {} as IDetailsLine;
      // remove this assigned string after functions is implemented
      let dbname: string;

      let { sourcebranchcode, biltystateno, biltyno } = req.body;

      sourcebranchcode = sourcebranchcode.toUpperCase();

      if (sourcebranchcode === "") {
        // do nothing
      } else {
        dbname = await GetBranchDBName_Web(sourcebranchcode) + ".";
        biltynofull = getFullDocumentNo(sourcebranchcode, biltystateno, biltyno); 

        sql = `select sourcebranchcode, 
        biltystateno, 
        biltyno, 
        biltydate, 
        biltyfrom, 
        biltyto, 
        fbm.branchname as frombranchname, 
        tbm.branchname as tobranchname, 
        b.outwardsourcebranchcode, 
        b.outwardstateno, 
        b.outwardno, 
        b.cancellationno
        from (${dbname}bilty as b left join 
        branchmaster as fbm 
        on b.biltyfrom = fbm.branchid) left join 
        branchmaster as tbm 
        on b.biltyto = tbm.branchid
        where b.biltynofull = ?`;
        values= [biltynofull];

        logQuery(sql, values);
        const [rows] : any = await connection.query(sql, values);

        if (rows?.length === 0) {
          apiresponse["status"] = "error";
          apiresponse["message"] = "G.R. not found";
          apiresponse["details"] = [];
        } else {
          let row = rows[0] as any;

          sourcebranchcode = row["sourcebranchcode"];
          biltystateno = row["biltystateno"];
          biltyno = row["biltyno"];
          biltydate = formatDateDMY(row["biltydate"]);

          let outwardto = '';
          let outwarddate = '';
          let branchname = '';
          let challannofull = '';
          let inwarddate = '';
          let receiptdate = '';
          let frombranchname = ucwords(row["frombranchname"]); 
          let tobranchname = row["tobranchname"];
          let outwardsourcebranchcode = row["outwardsourcebranchcode"];
          let outwardstateno = row["outwardstateno"];
          let outwardno = row["outwardno"];
          let cancellationno = row["cancellationno"];

          let outwardnofull = "";

          if (outwardno !== 0) {
            outwardnofull = getFullDocumentNo(outwardsourcebranchcode, outwardstateno, outwardno);
          }

          if(cancellationno !== 0){
            apiresponse["grstatus"] = 'CANCELLED G.R.';
          } else {
            apiresponse["grstatus"] = '';
            apiresponse["grno"] = biltynofull;
          }
          
          apiresponse["from"] = frombranchname;
          apiresponse["to"] = tobranchname;

          details_line["date"] = biltydate;
          details_line["particulars"] = "Booked at " + frombranchname;
          details.push(details_line);
          details_line = {} as IDetailsLine;
          
          if(cancellationno === 0){
            if(outwardno !== 0){
              sql = `select outwardnofull, 
              outwarddate, 
              outwardto, 
              branchname  
              from ${dbname}outward as o left join branchmaster as bm 
              on o.outwardto = bm.branchid
              where o.outwardnofull = ? and 
              o.cancellationno = 0`;
              values = [outwardnofull]; 

              logQuery(sql, [values]);
              const [outward_rows]: any = await connection.query(sql,values);

              let outwardrowdata = outward_rows[0];
              outwardto = outwardrowdata["outwardto"];
              outwarddate = formatDateDMY(outwardrowdata["outwarddate"]);
              branchname = ucwords(outwardrowdata["branchname"])
              details_line["date"] = outwarddate
              details_line["particulars"] = `Dispatched to ${branchname}`;
              details.push(details_line);
              details_line = {} as IDetailsLine;

              while(true){
                if (outwardto === ""){
                  console.log("outward to blank ");
                  break;
                }

                // dbname = GetBranchDBName_BranchId_Web(link,outwardto) + ".";
                challannofull = outwardnofull;
                sql = `select inwarddate from ${dbname}inward as i left join ${dbname}inwardtrans as it
                  on i.challannofull = it.challannofull
                  where biltynofull = ? and it.cancellationno = 0`;
                values = [biltynofull];

                logQuery(sql, values);
                const [inward_rows]: any = await connection.query(sql, values)

                if(inward_rows.length === 0){
                  break;
                } else {
                  let inwardrowdata = inward_rows[0];

                  inwarddate = formatDateDMY(inwardrowdata["inwarddate"]);

                  details_line['date'] = inwarddate;
                  details_line['particulars'] = 'Received at ' + branchname;
                  details.push(details_line);
                  details_line = {} as IDetailsLine;

                  sql = `select o.outwardnofull, outwarddate, outwardto, branchname  
                  from (${dbname}outward as o left join ${dbname}outwardtrans as ot
                  on o.outwardnofull = ot.outwardnofull) left join branchmaster as bm 
                  on o.outwardto = bm.branchid
                  where biltynofull = ? and ot.cancellationno = 0`;
                  values = [biltynofull];

                  logQuery(sql, values);
                  const [outward_outwardtrans_rows]: any = await connection.query(sql, values);

                  if (outward_outwardtrans_rows.length === 0) {
                    sql = `select receiptdate
                      from ${dbname}freightreceipt 
                      where  biltynofull = ?
                      and cancellationno = 0 `;

                    logQuery(sql, values);
                    const [receipt_rows]: any = await connection.query(sql, values);

                    if(receipt_rows.length > 0){
                      let receiptrowdata = receipt_rows[0];
                      receiptdate = formatDateDMY(receiptrowdata["receiptdate"]);

                      details_line['date'] = receiptdate;
                      details_line['particulars'] = 'Delivered at ' + branchname;
                      details.push(details_line);
                      details_line = {} as IDetailsLine;
                    }
                    break;
                  } else {
                    let outward_outwardtrans_rowdata = outward_outwardtrans_rows[0];
                    outwardnofull = outward_outwardtrans_rowdata["outwardnofull"];
                    outwardto = outward_outwardtrans_rowdata["outwardto"];
                    outwarddate = formatDateDMY(outward_outwardtrans_rowdata["outwarddate"]);
                    branchname = ucwords(outward_outwardtrans_rowdata["branchname"]);

                    details_line['date'] = outwarddate;
                    details_line['particulars'] = 'Dispatched to ' + branchname;
                    details.push(details_line);
                    details_line = {} as IDetailsLine;
                  }
                }
              }
            }
          }
          apiresponse["details"] = details;
        }
      }
      return res.status(200).json(apiresponse);
    }
  )
);

export default router;
