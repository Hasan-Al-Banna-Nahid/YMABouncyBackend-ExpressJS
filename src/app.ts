// src/app.ts
import cookieParser from "cookie-parser";
import cors, { CorsOptionsDelegate } from "cors";
import express from "express";
import {
  errorConverter,
  errorHandler,
} from "./app/middlewares/error.middleware";
import router from "./app/routes";

const app = express();

// CORS FIRST — before parsers/routes
// const ALLOWED_ORIGINS = new Set([
//     "http://localhost:3000",
//     "http://127.0.0.1:3000",
//     "https://yma-three.vercel.app",  // your frontend
// ]);

// app.use((req, res, next) => {
//     const origin = req.headers.origin as string | undefined;

//     if (origin && ALLOWED_ORIGINS.has(origin)) {
//         res.setHeader("Access-Control-Allow-Origin", origin);
//         res.setHeader("Vary", "Origin"); // important for caches/proxies
//         res.setHeader("Access-Control-Allow-Credentials", "true");
//         res.setHeader(
//             "Access-Control-Allow-Headers",
//             "Content-Type, Authorization, Accept"
//         );
//         res.setHeader(
//             "Access-Control-Allow-Methods",
//             "GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS"
//         );
//     }

//     if (req.method === "OPTIONS") {
//         // Always answer preflight quickly
//         return res.sendStatus(204);
//     }
//     next();
// });

// app.use(
//   cors({
//     origin: ["http://localhost:3000"],
//     methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
//     credentials: true,
//   })
// );

// 1) Keep a whitelist
const ALLOWED = new Set<string>([
  "http://localhost:3000",
  // add your deployed frontend domain(s) here when you have them, e.g.:
  // "https://yma-three.vercel.app",
]);

// 2) Single CORS delegate — no manual res.setHeader anywhere
const corsOptions: CorsOptionsDelegate = (req, cb) => {
  const origin = (req.headers["origin"] as string) || "";

  const isAllowed = ALLOWED.has(origin);
  cb(null, {
    origin: isAllowed ? origin : false, // false -> no CORS headers
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    maxAge: 86400, // cache preflight for a day
  });
};

// 3) MUST be before any routes/parsers
app.use(cors(corsOptions));
// Handle all preflights with the same options
app.options("*", cors(corsOptions));

// Body parsers AFTER CORS
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// Health
app.get("/", (_req, res) => res.send("Welcome To YMA Bouncy Castle API V1"));

// Routes
app.use(router);

// Errors
app.use(errorConverter);
app.use(errorHandler);

export default app;
