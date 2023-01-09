import DataLoader from "dataloader";
import { dataManager } from "../AppDataSource";
import { Updoot } from "../entities/Updoot";

//this batches and caches users in a single request

//[{ postId: 5, userId: 10 }]
//we load { postId: 5, userId: 10 }
//then return [{ postId: 5, userId: 10 , 1}]
export const createUpdootLoader = () => new DataLoader<{ 
    postId: number,
    userId: number,
}, Updoot | null>(
async (keys) => {
    const updoots = await dataManager
    .getRepository(Updoot)
    .createQueryBuilder()
    .whereInIds(keys)
    .getMany();
    const updootIdsToUpdoot: Record<string, Updoot> = {};
    updoots.forEach((updoot) => {
        updootIdsToUpdoot[`${updoot.userId}|${updoot.postId}`] = updoot;
    })

    return keys.map(key => updootIdsToUpdoot[`${key.userId}|${key.postId}`]);
});