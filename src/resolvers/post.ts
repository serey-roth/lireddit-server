import { PostEntity as Post } from "../entities/Post";
import AppDataSource, { dataManager } from '../AppDataSource';
import { Resolvers } from "../util/resolvers-types";

const PostResolver: Resolvers = { 
    Query: {
        //cursor is the starting point to execute pagination
        async posts(_, { limit, cursor }) {
            const realLimit = Math.min(50, limit);
            const query = AppDataSource
            .getRepository(Post)
            .createQueryBuilder("p")
            .orderBy('"createdAt"', "DESC")
            .take(realLimit)

            if (cursor) {
                query.where('"createdAt" < :cursor', { //get the next post from cursor
                    cursor: new Date(parseInt(cursor)),
                })
            }

            return query.getMany();
        },
        post(_, args) {
            return dataManager.findOneBy(Post, { id: args.id });    
        }
    },
    Mutation: {
        async createPost(_, { input }, { req }) {
            const post = dataManager.create(Post, { 
                ...input,
                creatorId: req.session.userId,
            });
            try {
                return await dataManager.save(post);
            } catch (error) {
                throw new Error(error.message)
            }
        },
        async updatePost(_, { title, id }) {
            const post = await dataManager.findOneBy(Post, { id });
            if (!post) {
                return null;
            }
            if (typeof title !== 'undefined') {
                await dataManager.update(Post, 
                    { id }, 
                    { title: title === null ? undefined : title });
            }
            return post;
        },
        async deletePost(_, { id }) {
            await dataManager.delete(Post, id);
            return true;
        } 
    },
    Post: {
        //this would be a field resolver for type-graphql
        textSnippet: (post) => post.text.slice(0, 50), 
    }
}

export default PostResolver;