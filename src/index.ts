import "reflect-metadata";
import express from "express";
import cors from "cors";
import { json } from "body-parser";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault, } from "@apollo/server/plugin/landingPage/default";
import { expressMiddleware } from '@apollo/server/express4';
import { buildSchema } from "type-graphql";
import { HelloResolver } from "./resolvers/hello";
import { PostResolver } from "./resolvers/post";
import { UserResolver } from "./resolvers/user";
import session from "express-session";
import connectRedis, { RedisStoreOptions } from "connect-redis";
import Redis from "ioredis";
import { COOKIE_NAME, __prod__ } from "./constants";
import { MyContext } from "./types";
import AppDataSource from "./AppDataSource";

const main = async () => {
    await AppDataSource.initialize();

    //set up database connection with mikroorm
    //const orm = await MikroORM.init(mikroOrmConfig);
    //await orm.getMigrator().up();

    //const generator = orm.getSchemaGenerator();
    //await generator.updateSchema();

    const app = express();

    const RedisStore = connectRedis(session)
    const redis = new Redis();

    const redisStoreOptions: RedisStoreOptions = {
        client: redis,
        disableTouch: true,//keep the session alive forever
    }

    app.set("trust proxy", !__prod__);
    app.set("Access-Control-Allow-Origin", [
        "https://studio.apollographql.com", 
        "http://localhost:3000"
    ]);
    app.set("Access-Control-Allow-Credentials", true);

    app.use(
        cors({
          credentials: true,
          origin: [
            "https://studio.apollographql.com",
            "http://localhost:4040/graphql",
            "http://localhost:3000"
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
        },
        saveUninitialized: false,
        secret: "keyboard cat",
        resave: false,
    }));

    const apolloServer = new ApolloServer({
        schema: await buildSchema({//set graphql schema
            resolvers: [HelloResolver, PostResolver, UserResolver],
            validate: false,
        }),
        plugins: [
            ApolloServerPluginLandingPageLocalDefault({
                includeCookies: true,
            }),
        ],
    });
    
    await apolloServer.start();

    app.use('/graphql',
        json(), 
        expressMiddleware(apolloServer, {
            context: async ({ req, res }): Promise<MyContext> => ({ 
                req, 
                res,
                redis
            }), //share context with all resolvers in the apollo server
        })
    );

    app.listen(4040, () => {
        console.log('Server started on localhost:4040');
    });

    /*const generator = orm.getSchemaGenerator();
    await generator.updateSchema();

    await RequestContext.createAsync(orm.em, async () => {
        const post = orm.em.create(Post, {
            title: 'My first post',
            createdAt: "",
            updatedAt: ""
        });//create post object -- the same as calling the Post constructor
    
        await orm.em.persistAndFlush(post);
    });*/
};

main();