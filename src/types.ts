import { Request, Response } from "express";
import { Session } from "express-session";
import { Redis } from "ioredis";
import { createUpdootLoader } from "./util/createUpdootLoader";
import { createUserLoader } from "./util/createUserLoader";

export type MyContext = {
    req: Request,
    res: Response,
    redis: Redis,
    userLoader: ReturnType<typeof createUserLoader>,
    updootLoader: ReturnType<typeof createUpdootLoader>,
};

export type SessionWithUser = Session & {
    userId?: number,
}