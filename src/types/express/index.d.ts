// src/types/express/index.d.ts
import "express";
import { IUser } from '../../interfaces/user.interface';

declare module "express-serve-static-core" {
    interface Request {
        user?: {
            id: string;
            role: string;
            email?: string;
            name?: string;
            // add more fields if you attach them in protect()
        };
    }
}



// src/types/express/index.d.ts
import type { IUser } from "../../interfaces/user.interface";

declare global {
    namespace Express {
        /** What passport/your app stores on req.user */
        interface User extends IUser {}

        interface Request {
            /** Now req.user is your IUser (or undefined if not set) */
            user?: IUser;
        }
    }
}

export {}; // ensure this file is treated as a module


import { Secret } from 'jsonwebtoken';

declare namespace NodeJS {
    interface ProcessEnv {
        JWT_SECRET: Secret;
        JWT_EXPIRES_IN: string;
    }
}