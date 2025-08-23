
import express from 'express';
import cors from 'cors';
import { errorConverter, errorHandler } from './app/middlewares/error.middleware';
import router from './app/routes';
import cookieParser from "cookie-parser";

const app = express();

// Enable CORS

const allowedOrigins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
];

app.use(
    cors({
        origin(origin, cb) {
            // allow mobile apps / curl (no origin)
            if (!origin) return cb(null, true);
            if (allowedOrigins.includes(origin)) return cb(null, true);
            return cb(new Error(`CORS: ${origin} not allowed`));
        },
        credentials: true, // <-- needed if you send cookies
        methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization",
            "X-Requested-With",
            "Accept",
        ],
        exposedHeaders: ["Content-Length", "Content-Range"],
    })
);

// make sure preflight passes quickly
app.options("*", cors());

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '100000kb' }));
app.use(express.urlencoded({ extended: true, limit: '100000kb' }));
app.use(cookieParser());





// 2) ROUTES
app.get("/",(req,res)=>{
    res.send("Welcome To YMA Bouncy Castle API V1")
})
app.use(router);

// 3) ERROR HANDLING
app.use(errorConverter);
app.use(errorHandler);



export default app;