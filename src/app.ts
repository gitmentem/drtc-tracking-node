import express from "express"
import helmet from "helmet"
import { errorMiddleware } from "@/middlewares/error.js"
import morgan from "morgan"
import dotenv from "dotenv"
import trackingRoutes from "@/routes/api.route.js";
  
dotenv.config({path: './.env',});

export const envMode = process.env.NODE_ENV?.trim() || 'DEVELOPMENT';
const port = process.env.PORT || 3000;

const app = express();
  
app.use(
  helmet({
    contentSecurityPolicy: envMode !== "DEVELOPMENT",
    crossOriginEmbedderPolicy: envMode !== "DEVELOPMENT",
  })
);
    
app.use(express.json());
app.use(express.urlencoded({extended: true}));
app.use(morgan('dev'))
  
app.get('/', (req, res) => {
  res.send('Welcome to the DRTC Tracking API.');
});
  
app.use("/api/v1", trackingRoutes)
  
app.use(errorMiddleware);
  
app.listen(port, () => console.log('Server is working on Port:'+port+' in '+envMode+' Mode.'));

// this is causing issue such as path-to-regexp
// app.get("*", (req, res) => {
//   res.status(404).json({
//     success: false,
//     message: "Page not found",
//   });
// });
  