"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataManager = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    database: 'lireddit',
    username: 'serey',
    password: 'Mombytour123!?',
    logging: true,
    synchronize: true,
    entities: [Post_1.PostEntity, User_1.UserEntity]
});
exports.dataManager = AppDataSource.manager;
exports.default = AppDataSource;
//# sourceMappingURL=AppDataSource.js.map