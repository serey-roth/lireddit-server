import { PostEntity as Post } from "../entities/Post";
import AppDataSource, { dataManager } from '../AppDataSource';
import { Resolvers } from "../util/resolvers-types";

const PostResolver: Resolvers = { 
    Query: {
        //cursor is the starting point to execute pagination
        async posts(_, { limit, cursor }) {
            const realLimit = Math.min(50, limit);
            const paginatedLimit = Math.min(50, limit) + 1;//for hasMore
            
            /* raw sql for fetching paginated posts       
             const replacements: any[] = [paginatedLimit]
            if (cursor) replacements.push(cursor);
            const results = await AppDataSource.query(`
                select p.*,
                //if we don't use this, all the creator data appear in the 
                //top level of post
                json_build_object( 
                    'id', u.id,
                    'username', u.username,
                    'email', u.email
                ) creator
                from post_entity p
                inner join user_entity u on u.id = p."creatorId"
                ${cursor ? `where p."createdAt" < $2` : ''}
                order by p."createdAt" DESC
                limit $1
            `, replacements); */
            
            const query = AppDataSource
            .getRepository(Post)
            .createQueryBuilder("post")
            .innerJoinAndSelect(
                "post.creator",
                "u",
                'post."creatorId" = u.id', //join the user id to creatorId in post
            )
            .orderBy('post."createdAt"', "DESC")
            .limit(paginatedLimit) //take won't work with innerjoin

            if (cursor) {
                query.where('post."createdAt" < :cursor', { //get the next post from cursor
                    cursor: new Date(parseInt(cursor)),
                })
            }

            const posts = await query.getMany();

            return {
                posts: posts.slice(0, realLimit),
                hasMore: posts.length === paginatedLimit,
            };
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