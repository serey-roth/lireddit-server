import DataLoader from "dataloader";
import { dataManager } from "../AppDataSource";
import { UserEntity as User } from "../entities/User";
import { In } from "typeorm";

//this batches and caches users in a single request

//keys: [1, 32, 23, 14]
//output: [{ id: 1, ...}, {id: 32, ...}, { id: 23, ...}, { id: 14, ...}]
export const createUserLoader = () => new DataLoader<number, User>(
async (userIds) => {
    const users = await dataManager.findBy(User, { id: In(userIds) });
    const userIdToUser: Record<number, User> = {};
    users.forEach(u => {
        userIdToUser[u.id] = u;
    })
    return userIds.map(userId => userIdToUser[userId]);
});