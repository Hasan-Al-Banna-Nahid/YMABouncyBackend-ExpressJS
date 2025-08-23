// src/app.ts
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { errorConverter, errorHandler } from "./app/middlewares/error.middleware";
import router from "./app/routes";

const app = express();

// Allow only the frontends that should talk to this API
const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://yma-three.vercel.app",  // your frontend
];

// IMPORTANT: do NOT also call app.use(cors()) elsewhere.
// This must be the ONLY CORS middleware.
const corsOptions: cors.CorsOptions = {
    origin(origin, cb) {
        // allow server-to-server and curl (no Origin header)
        if (!origin) return cb(null, true);
        return cb(null, ALLOWED_ORIGINS.includes(origin));
    },
    credentials: true,
    methods: ["GET","HEAD","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","Accept"],
    exposedHeaders: ["Content-Length","Content-Range"],
    maxAge: 86400,
};

app.use(cors(corsOptions));
// Make sure every preflight succeeds
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
