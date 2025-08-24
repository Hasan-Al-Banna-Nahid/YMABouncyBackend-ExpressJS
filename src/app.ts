// app.ts
import express from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";

const app = express();

const ALLOWED = new Set<string>([
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://<YOUR-FRONTEND-DOMAIN>",
]);

// Normalize possible string | string[] | undefined
const getOrigin = (hdr: string | string[] | undefined): string | undefined =>
  Array.isArray(hdr) ? hdr[0] : hdr;

const corsDelegate: CorsOptionsDelegate = (req, cb) => {
  const originHeader = getOrigin(req.headers.origin);
  // If you also want to allow non-browser tools (no Origin), set allow = true when undefined
  const allow = originHeader ? ALLOWED.has(originHeader) : true;

  const options: CorsOptions = {
    origin: allow ? originHeader : false,
    credentials: true,
    methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "Accept"],
    exposedHeaders: ["Content-Length", "Content-Range"],
    maxAge: 86400,
  };

  cb(null, options);
};

app.use(cors(corsDelegate));
app.options("*", cors(corsDelegate));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);

export default app;
