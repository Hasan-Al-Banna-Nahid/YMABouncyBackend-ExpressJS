import dotenv from "dotenv";
dotenv.config();
import mongoose from 'mongoose';
import { config } from './config';
import logger from '../utils/logger';

const connectDB = async () => {
    try {
        await mongoose.connect(config.mongo.uri,{
        dbName: 'YMA', // optional override (ensures YMA even if URI has /test)
    });
        logger.info('MongoDB connected successfully');
    } catch (error) {
        logger.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
    logger.info('MongoDB reconnected');
});

process.on('SIGINT', async () => {
    await mongoose.connection.close();
    logger.info('MongoDB connection closed due to app termination');
    process.exit(0);
});

export default connectDB;