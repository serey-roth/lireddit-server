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
const AppDataSource_1 = __importStar(require("../AppDataSource"));
const Post_1 = require("../entities/Post");
const Updoot_1 = require("../entities/Updoot");
const PostResolver = {
    Query: {
        async posts(_, { limit, cursor }, { req }) {
            const realLimit = Math.min(50, limit);
            const paginatedLimit = Math.min(50, limit) + 1;
            const replacements = [paginatedLimit];
            if (req.session.userId) {
                replacements.push(req.session.userId);
            }
            let cursorIdx = 3;
            if (cursor) {
                replacements.push(new Date(parseInt(cursor)));
                cursorIdx = replacements.length;
            }
            const posts = await AppDataSource_1.default.query(`
                select p.*,
                json_build_object( 
                    'id', u.id,
                    'username', u.username,
                    'email', u.email
                ) creator,
                ${req.session.userId ?
                '(select value from updoot where "userId" = $2 and "postId" = p.id) "voteStatus"' :
                'null as "voteStatus"'}
                from post_entity p
                inner join user_entity u on u.id = p."creatorId"
                ${cursor ? `where p."createdAt" < $${cursorIdx}` : ''}
                order by p."createdAt" DESC
                limit $1
            `, replacements);
            return {
                posts: posts.slice(0, realLimit),
                hasMore: posts.length === paginatedLimit,
            };
        },
        post(_, args) {
            return AppDataSource_1.dataManager.findOne(Post_1.PostEntity, {
                relations: ['creator'],
                where: { id: args.id }
            });
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
        async updatePost(_, { title, id, text }, { req }) {
            const results = await AppDataSource_1.default
                .createQueryBuilder()
                .update(Post_1.PostEntity)
                .set({ title, text })
                .where('id = :id and "creatorId" = :creatorId', {
                id,
                creatorId: req.session.userId
            })
                .returning("*")
                .execute();
            console.log(results.raw[0]);
            return results.raw[0];
        },
        async deletePost(_, { id }, { req }) {
            await AppDataSource_1.dataManager.delete(Post_1.PostEntity, { id, creatorId: req.session.userId });
            return true;
        },
        async vote(_, { postId, value }, { req }) {
            const { userId } = req.session;
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;
            const existingUpdoot = await AppDataSource_1.dataManager.findOneBy(Updoot_1.Updoot, { postId, userId });
            if (existingUpdoot && existingUpdoot.value !== realValue) {
                try {
                    await AppDataSource_1.dataManager.transaction(async (entityManager) => {
                        await entityManager.update(Updoot_1.Updoot, { postId, userId }, { value: realValue });
                        await entityManager.increment(Post_1.PostEntity, { id: postId }, "points", 2 * realValue);
                    });
                    return true;
                }
                catch (error) {
                    console.log(error.message);
                    return false;
                }
            }
            else if (!existingUpdoot) {
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
            else {
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