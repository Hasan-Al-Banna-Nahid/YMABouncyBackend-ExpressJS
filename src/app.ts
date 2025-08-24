import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import {
  errorConverter,
  errorHandler,
} from "./app/middlewares/error.middleware";
import router from "./app/routes";

const app = express();

const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://yma-three.vercel.app", // your frontend (prod) if any
  "https://yma-eight.vercel.app", // your API origin itself (ok to include)
];

const corsOptions: cors.CorsOptions = {
  origin(origin, cb) {
    // allow curl / server-to-server where Origin is undefined
    if (!origin) return cb(null, true);
    cb(null, ALLOWED_ORIGINS.includes(origin));
  },
  credentials: true, // <— required for cookies
  methods: ["GET", "HEAD", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Accept"],
  exposedHeaders: ["Content-Length", "Content-Range"],
  maxAge: 86400, // cache preflight for a day
};

// CORS *before* body parsers & routes
app.use(cors(corsOptions));

// Body parser, reading data from body into req.body
app.use(express.json({ limit: "100000kb" }));
app.use(express.urlencoded({ extended: true, limit: "100000kb" }));
app.use(cookieParser());

// 2) ROUTES
app.get("/", (req, res) => {
  res.send("Welcome To YMA Bouncy Castle API V1");
});
app.use(router);

// 3) ERROR HANDLING
app.use(errorConverter);
app.use(errorHandler);

export default app;
