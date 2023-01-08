import { DataSource } from "typeorm";
import { PostEntity as Post } from "./entities/Post";
import { UserEntity as User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";

const AppDataSource = new DataSource({
    type: 'postgres',
    database: 'lireddit',
    username: 'serey',
    password: 'Mombytour123!?',
    logging: true,
    synchronize: true,
    migrations: [path.join(__dirname, '/migrations/*')],
    entities: [Post, User, Updoot]
});

export const dataManager = AppDataSource.manager;

export default AppDataSource;