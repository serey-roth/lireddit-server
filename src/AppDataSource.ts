import { DataSource } from "typeorm";
import { PostEntity as Post } from "./entities/Post";
import { UserEntity as User } from "./entities/User";
import path from "path";
import { Updoot } from "./entities/Updoot";
import dotenv from 'dotenv-safe';

dotenv.config();

const AppDataSource = new DataSource({
    type: 'postgres',
    // database: 'lireddit2',
    // username: 'serey',
    // password: 'Mombytour123!?',
    url: process.env.DATABASE_URL,
    logging: true,
    //synchronize: true,
    migrations: [path.join(__dirname, '/migrations/*')],
    entities: [Post, User, Updoot]
});

export const dataManager = AppDataSource.manager;

export default AppDataSource;