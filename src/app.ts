
import express from 'express';
import cors from 'cors';
import { errorConverter, errorHandler } from './middlewares/error.middleware';
import router from './routes';
import connectDB from './config/db';

const app = express();


// Body parser, reading data from body into req.body
app.use(express.json({ limit: '1000kb' }));
app.use(express.urlencoded({ extended: true, limit: '1000kb' }));




// Enable CORS
app.use(cors());
app.options('*', cors());

// 2) ROUTES
app.use(router);

// 3) ERROR HANDLING
app.use(errorConverter);
app.use(errorHandler);

// 4) DATABASE CONNECTION
connectDB();

export default app;