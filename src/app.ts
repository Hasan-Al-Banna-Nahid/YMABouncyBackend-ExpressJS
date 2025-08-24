// app.ts
import express from "express";
import cors, { CorsOptions, CorsOptionsDelegate } from "cors";
import cookieParser from "cookie-parser";
import router from "./app/routes";

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true,
  optionSuccessStatus: 200,
};
const app = express();

app.use(cors(corsOptions));

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/api/v1", router);

export default app;
