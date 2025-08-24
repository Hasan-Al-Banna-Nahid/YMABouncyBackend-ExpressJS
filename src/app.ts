// app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";

const app = express();

// Whitelist your frontends
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://yma-three.vercel.app",   // your frontend prod
];

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    if (!origin) return cb(null, true);                // allow server-to-server & curl
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true,                                    // <-- needed for cookie auth
  methods: ["GET","HEAD","POST","PUT","PATCH","DELETE","OPTIONS"],
  allowedHeaders: ["Content-Type","Authorization","Accept"],
  exposedHeaders: ["Content-Length","Content-Range"],
  maxAge: 86400,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));                     // preflight

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);

export default app;
