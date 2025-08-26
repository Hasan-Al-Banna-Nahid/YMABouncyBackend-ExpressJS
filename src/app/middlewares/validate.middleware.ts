import { Request, Response, NextFunction } from 'express';
import ApiError from '../utils/apiError';

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
            return next(new ApiError('Validation failed', 400, (error as any).errors));
        }
    };

export default validate;