/* import { Options } from "@mikro-orm/postgresql";
import path from "path";
import { __prod__ } from "./constants";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

const config: Options = {
    migrations: {
        path: path.join(__dirname, './migrations'),
        glob: '!(*.d).{js,ts}', //pattern
    },
    entities: [Post, User], //database tables
    dbName: 'react_graphql_boilerplate',
    user: 'serey',
    password: 'Mombytour123!?',
    type: "postgresql",
    debug: !__prod__,
};

export default config; */