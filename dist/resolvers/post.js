"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Post_1 = require("../entities/Post");
const AppDataSource_1 = require("../AppDataSource");
const PostResolver = {
    Query: {
        posts() {
            return AppDataSource_1.dataManager.find(Post_1.PostEntity);
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
        }
    }
};
exports.default = PostResolver;
//# sourceMappingURL=post.js.map