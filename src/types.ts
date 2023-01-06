import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";

export type MyContext = {
    req: Request,
    res: Response,
    redis: Redis,
};

export type SessionWithUser = Session & {
    userId?: number,
}