"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataManager = void 0;
const typeorm_1 = require("typeorm");
const Post_1 = require("./entities/Post");
const User_1 = require("./entities/User");
const path_1 = __importDefault(require("path"));
const Updoot_1 = require("./entities/Updoot");
const AppDataSource = new typeorm_1.DataSource({
    type: 'postgres',
    database: 'lireddit',
    username: 'serey',
    password: 'Mombytour123!?',
    logging: true,
    synchronize: true,
    migrations: [path_1.default.join(__dirname, '/migrations/*')],
    entities: [Post_1.PostEntity, User_1.UserEntity, Updoot_1.Updoot]
});
exports.dataManager = AppDataSource.manager;
exports.default = AppDataSource;
//# sourceMappingURL=AppDataSource.js.map