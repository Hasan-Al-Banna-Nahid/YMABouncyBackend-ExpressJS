import { Request, Response, NextFunction } from 'express';
import throw ApiError from '../utils/throw ApiError';

const validate = (schema:any) =>
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            return next();
        } catch (error) {
            return next(new throw ApiError('Validation failed', 400, (error as any).errors));
        }
    };

export default validate;