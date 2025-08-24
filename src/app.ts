// app.ts
import express, { NextFunction } from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
const app = express();

const customCors = (req: any, res: any, next: any) => {
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*"); // Use specific origin in production
  // Another common pattern: Allow dynamic origin
  // res.setHeader('Access-Control-Allow-Origin', req.headers.origin);
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle preflight request (OPTIONS)
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Proceed to next middleware or route
  next();
};

// Apply built-in CORS middleware (allowing all origins in this case)
app.use(cors());

// Apply custom CORS middleware for additional headers
app.use(customCors);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);

export default app;
