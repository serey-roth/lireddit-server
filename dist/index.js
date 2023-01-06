"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const body_parser_1 = require("body-parser");
const server_1 = require("@apollo/server");
const default_1 = require("@apollo/server/plugin/landingPage/default");
const express4_1 = require("@apollo/server/express4");
const type_graphql_1 = require("type-graphql");
const hello_1 = require("./resolvers/hello");
const post_1 = require("./resolvers/post");
const user_1 = require("./resolvers/user");
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const ioredis_1 = __importDefault(require("ioredis"));
const constants_1 = require("./constants");
const AppDataSource_1 = __importDefault(require("./AppDataSource"));
const main = async () => {
    await AppDataSource_1.default.initialize();
    const app = (0, express_1.default)();
    const RedisStore = (0, connect_redis_1.default)(express_session_1.default);
    const redis = new ioredis_1.default();
    const redisStoreOptions = {
        client: redis,
        disableTouch: true,
    };
    app.set("trust proxy", !constants_1.__prod__);
    app.set("Access-Control-Allow-Origin", [
        "https://studio.apollographql.com",
        "http://localhost:3000"
    ]);
    app.set("Access-Control-Allow-Credentials", true);
    app.use((0, cors_1.default)({
        credentials: true,
        origin: [
            "https://studio.apollographql.com",
            "http://localhost:4040/graphql",
            "http://localhost:3000"
        ],
    }));
    app.use((0, express_session_1.default)({
        name: constants_1.COOKIE_NAME,
        store: new RedisStore(redisStoreOptions),
        cookie: {
            maxAge: 1000 * 60 * 60 * 24 * 365 * 10,
            httpOnly: true,
            secure: constants_1.__prod__,
            sameSite: "lax",
        },
        saveUninitialized: false,
        secret: "keyboard cat",
        resave: false,
    }));
    const apolloServer = new server_1.ApolloServer({
        schema: await (0, type_graphql_1.buildSchema)({
            resolvers: [hello_1.HelloResolver, post_1.PostResolver, user_1.UserResolver],
            validate: false,
        }),
        plugins: [
            {
                async unexpectedErrorProcessingRequest({ requestContext }) {
                    console.log(requestContext.errors?.[0].nodes);
                    console.log('hi');
                }
            },
            (0, default_1.ApolloServerPluginLandingPageLocalDefault)({
                includeCookies: true,
            }),
        ],
    });
    await apolloServer.start();
    app.use('/graphql', (0, body_parser_1.json)(), (0, express4_1.expressMiddleware)(apolloServer, {
        context: async ({ req, res }) => ({
            req,
            res,
            redis
        }),
    }));
    app.listen(4040, () => {
        console.log('Server started on localhost:4040');
    });
};
main();
//# sourceMappingURL=index.js.map