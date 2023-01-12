import "reflect-metadata";
import dotenv from "dotenv-safe";
import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault, } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from '@apollo/server/express4';
import PostResolver from "./resolvers/post";
import UserResolver from "./resolvers/user";
import session from "express-session";
import connectRedis, { RedisStoreOptions } from "connect-redis";
import Redis from "ioredis";
import { COOKIE_NAME, __prod__ } from "./constants";
import AppDataSource from "./AppDataSource";
import { readFileSync } from "fs";
import { makeExecutableSchema } from "graphql-tools";
import { applyMiddleware } from "graphql-middleware";
import { postMiddleware } from "./middleware/post";
import { MyContext } from "./types";
import { createUserLoader } from "./util/createUserLoader";
import { createUpdootLoader } from "./util/createUpdootLoader";

dotenv.config();

const main = async () => {
    await AppDataSource.initialize();
    //await AppDataSource.runMigrations();

    const app = express();

    const RedisStore = connectRedis(session)
    const redis = new Redis(process.env.REDIS_URL);

    const redisStoreOptions: RedisStoreOptions = {
        client: redis,
        disableTouch: true,//keep the session alive forever
    }

    app.set("trust proxy", 1);
    app.set("Access-Control-Allow-Origin", [
        "https://studio.apollographql.com", 
        process.env.CORS_ORIGIN
    ]);
    app.set("Access-Control-Allow-Credentials", true);

    app.use(
        cors({
          credentials: true,
          origin: [
            "https://studio.apollographql.com",
            "http://localhost:4040/graphql",
            process.env.CORS_ORIGIN
          ],
        })
      );

    app.use(session({
        name: COOKIE_NAME,
        store: new RedisStore(redisStoreOptions),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
            httpOnly: true,
            secure: __prod__, //cookie only works in https
            sameSite: "lax", //csrf prevention
            domain: __prod__ ? '.sereyratanakroth.com' : undefined,
        },
        saveUninitialized: false,
        secret: process.env.SESSION_SECRET,
        resave: false,
    }));

    const typeDefs = readFileSync('src/schema/schema.graphql', 
        { encoding: 'utf-8' });

    const schema = makeExecutableSchema({ typeDefs,
        resolvers: [PostResolver, UserResolver]
    });

    const schemaWithMiddleWare = applyMiddleware(schema, postMiddleware);

    const apolloServer = new ApolloServer({
        schema: schemaWithMiddleWare,
        includeStacktraceInErrorResponses: !__prod__,
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({
                includeCookies: true,
            }),
        ],
    });
    
    await apolloServer.start();

    app.use('/graphql', json(), 
        expressMiddleware(apolloServer, {
            context: async ({ req, res }): Promise<MyContext> => ({ 
                req, 
                res,
                redis,
                userLoader: createUserLoader(),
                updootLoader: createUpdootLoader(),
            }), //share context with all resolvers in the apollo server
        }));

    app.listen(parseInt(process.env.PORT), () => {
        console.log('Server started on localhost:4040');
    });
};

main();