"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserLoader = void 0;
const dataloader_1 = __importDefault(require("dataloader"));
const AppDataSource_1 = require("../AppDataSource");
const User_1 = require("../entities/User");
const typeorm_1 = require("typeorm");
const createUserLoader = () => new dataloader_1.default(async (userIds) => {
    const users = await AppDataSource_1.dataManager.findBy(User_1.UserEntity, { id: (0, typeorm_1.In)(userIds) });
    const userIdToUser = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    });
    return userIds.map(userId => userIdToUser[userId]);
});
exports.createUserLoader = createUserLoader;
//# sourceMappingURL=createUserLoader.js.map