"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const Post_1 = require("../entities/Post");
const AppDataSource_1 = __importStar(require("../AppDataSource"));
const Updoot_1 = require("../entities/Updoot");
const PostResolver = {
    Query: {
        async posts(_, { limit, cursor }) {
            const realLimit = Math.min(50, limit);
            const paginatedLimit = Math.min(50, limit) + 1;
            const query = AppDataSource_1.default
                .getRepository(Post_1.PostEntity)
                .createQueryBuilder("post")
                .innerJoinAndSelect("post.creator", "u", 'post."creatorId" = u.id')
                .orderBy('post."createdAt"', "DESC")
                .limit(paginatedLimit);
            if (cursor) {
                query.where('post."createdAt" < :cursor', {
                    cursor: new Date(parseInt(cursor)),
                });
            }
            const posts = await query.getMany();
            return {
                posts: posts.slice(0, realLimit),
                hasMore: posts.length === paginatedLimit,
            };
        },
        post(_, args) {
            return AppDataSource_1.dataManager.findOneBy(Post_1.PostEntity, { id: args.id });
        }
    },
    Mutation: {
        async createPost(_, { input }, { req }) {
            const post = AppDataSource_1.dataManager.create(Post_1.PostEntity, {
                ...input,
                creatorId: req.session.userId,
            });
            try {
                return await AppDataSource_1.dataManager.save(post);
            }
            catch (error) {
                throw new Error(error.message);
            }
        },
        async updatePost(_, { title, id }) {
            const post = await AppDataSource_1.dataManager.findOneBy(Post_1.PostEntity, { id });
            if (!post) {
                return null;
            }
            if (typeof title !== 'undefined') {
                await AppDataSource_1.dataManager.update(Post_1.PostEntity, { id }, { title: title === null ? undefined : title });
            }
            return post;
        },
        async deletePost(_, { id }) {
            await AppDataSource_1.dataManager.delete(Post_1.PostEntity, id);
            return true;
        },
        async vote(_, { postId, value }, { req }) {
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;
            const { userId } = req.session;
            const updoot = AppDataSource_1.dataManager.create(Updoot_1.Updoot, {
                value: realValue,
                userId,
                postId
            });
            try {
                await AppDataSource_1.dataManager.transaction(async (entityManager) => {
                    await entityManager.save(updoot);
                    await entityManager.increment(Post_1.PostEntity, { id: postId }, "points", realValue);
                });
                return true;
            }
            catch (error) {
                console.log(error.message);
                return false;
            }
        }
    },
    Post: {
        textSnippet: (post) => post.text.slice(0, 50),
    }
};
exports.default = PostResolver;
//# sourceMappingURL=post.js.map