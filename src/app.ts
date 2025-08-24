// app.ts
import express, { NextFunction } from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";
const app = express();

const allowedOrigins = [
  "http://localhost:3000", // Frontend dev URL
  "https://your-frontend-domain.com", // Production frontend URL
];

// CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g., mobile apps or curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        callback(null, origin); // Reflect the requesting origin
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true, // Allow cookies and credentials
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);

export default app;
