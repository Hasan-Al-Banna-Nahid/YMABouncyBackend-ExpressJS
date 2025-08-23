
import express from 'express';
import cors from 'cors';
import { errorConverter, errorHandler } from './app/middlewares/error.middleware';
import router from './app/routes';
import cookieParser from "cookie-parser";

const app = express();

// Enable CORS
app.use(cors());
app.options('*', cors());
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