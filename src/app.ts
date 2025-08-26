import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import authRouter from "./app/routes/auth.route";
import bookingRouter from "./app/routes/booking.route";
import inventoryRouter from "./app/routes/inventory.route";
import invoiceRouter from "./app/routes/invoice.route";
import productRouter from "./app/routes/product.route";
import adminRoutes from "./app/routes/admin.routes";

const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://yma-bouncy-castle-frontend-rlrg.vercel.app",
  "http://localhost:5000",
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.text());
app.use(cookieParser());

app.set("view engine", "ejs");
app.set("views", path.join(process.cwd(), "src", "app", "views"));

// Mount auth router at BOTH prefixes so either link works
app.use("/auth", authRouter); // <-- /auth/...
app.use("/api/v1/auth", authRouter); // <-- /api/v1/auth/...

// Other routers can stay on /api/v1/...
app.use("/api/v1/bookings", bookingRouter);
app.use("/api/v1/inventory", inventoryRouter);
app.use("/api/v1/invoices", invoiceRouter);
app.use("/api/v1/products", productRouter);
app.use("/api/v1/admin", adminRoutes);

// Health check
app.get("/healthz", (_req, res) => res.json({ ok: true }));

// 404 handler
app.use((req, res) =>
  res
    .status(404)
    .json({ status: "fail", message: "Not Found", path: req.originalUrl })
);

export default app;
