import { DataSource } from "typeorm";
import { Post } from "./entities/Post";
import { User } from "./entities/User";

const AppDataSource = new DataSource({
    type: 'postgres',
    database: 'lireddit',
    username: 'serey',
    password: 'Mombytour123!?',
    logging: true,
    synchronize: true,
    entities: [Post, User]
});

export const dataManager = AppDataSource.manager;

export default AppDataSource;