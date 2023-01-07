import { PostEntity as Post } from "../entities/Post";
import { dataManager } from '../AppDataSource';
import { Resolvers } from "../util/resolvers-types";

const PostResolver: Resolvers = { 
    Query: {
        posts() {
            return dataManager.find(Post);
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
    }   
}

export default PostResolver;