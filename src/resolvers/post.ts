import AppDataSource, { dataManager } from '../AppDataSource';
import { PostEntity as Post } from "../entities/Post";
import { Updoot } from "../entities/Updoot";
import { Resolvers } from "../util/resolvers-types";

const PostResolver: Resolvers = { 
    Query: {
        //cursor is the starting point to execute pagination
        async posts(_, { limit, cursor }) {
            const realLimit = Math.min(50, limit);
            const paginatedLimit = Math.min(50, limit) + 1;//for hasMore
            
            // raw sql for fetching paginated posts       
            const replacements: any[] = [paginatedLimit];

            if (cursor) {
                replacements.push(new Date(parseInt(cursor)));
            }

            //if we don't use json_build_object, all the creator data appear in the 
            //top level of post
            const posts = await AppDataSource.query(`
                select p.*
                from post_entity p
                ${cursor ? `where p."createdAt" < $2` : ''}
                order by p."createdAt" DESC
                limit $1
            `, replacements);
            
            /* const query = AppDataSource
            .getRepository(Post)
            .createQueryBuilder("post")
            .select("post.id", "id")
            .innerJoinAndSelect(
                "post.creator",
                "u",
                'post."creatorId" = u.id', //join the user id to creatorId in post
            )
            .addSelect((qb) => {
                return qb
                .select("vote.value")
                .from(Updoot, "vote")
                .where('"userId" = :userId')
                .andWhere('"postId" = post.id')
            }, "voteStatus")
            .setParameters({ userId: req.session.userId })
            .orderBy('post."createdAt"', "DESC")
            .limit(paginatedLimit) //take won't work with innerjoin

            if (cursor) {
                query.where('post."createdAt" < :cursor', { //get the next post from cursor
                    cursor: new Date(parseInt(cursor)),
                })
            }

            const posts = await query.getRawAndEntities() */

            return {
                posts: posts.slice(0, realLimit),
                hasMore: posts.length === paginatedLimit,
            };
        },
        post(_, { id }) {
            return dataManager.findOneBy(Post, { id });
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
        async updatePost(_, { title, id, text }, { req }) {
            const results = await AppDataSource
            .createQueryBuilder()
            .update(Post)
            .set({ title, text })
            .where('id = :id and "creatorId" = :creatorId', { 
                id, 
                creatorId: req.session.userId 
            })
            .returning("*")
            .execute();

            return results.raw[0];
        },
        async deletePost(_, { id }, { req }) {
            /* not using CASCADE 
            const post = await dataManager.findOneBy(Post, { id });

            if (!post) {
                return false;
            }

            if (post.creatorId !== req.session.userId) {
                throw new GraphQLError('not authorized', {
                    extensions: {
                        code: "UNAUTHORIZED",
                    }
                })
            }

            await dataManager.transaction(async (tm) => {
                await tm.delete(Updoot, { postId: id });
                await tm.delete(Post, { id, creatorId: req.session.userId }); //can only delete your own post
            }) */

            await dataManager.delete(Post, { id, creatorId: req.session.userId });
            return true;
        },
        async vote(_, { postId, value }, { req }) {
            const { userId } = req.session;
            const isUpdoot = value !== -1;
            const realValue = isUpdoot ? 1 : -1;

            const existingUpdoot = await dataManager.findOneBy(Updoot, 
                { postId, userId });

            //the user has voted on the post before and they are
            //changing their vote
            if (existingUpdoot && existingUpdoot.value !== realValue) {
                try {
                    await dataManager.transaction(async (entityManager) => {
                        await entityManager.update(Updoot, 
                            { postId, userId},
                            { value: realValue });
                        await entityManager.increment(Post, 
                            { id: postId }, 
                            "points",
                            2 * realValue // if current is 1, downdoot gives -1 vice versa
                        );
                    })
                    return true;
                } catch (error) {
                    console.log(error.message);
                    return false;
                }
            // the user has never voted on this post
            } else if (!existingUpdoot) {
                const updoot = dataManager.create(Updoot, {
                    value: realValue,
                    userId,
                    postId
                });
                try {
                    /* raw sql
                        query(`
                        START TRANSACTION
                            insert into updoot ("userId", "postId", "value")
                            values ($1, $2, $3)
                            update post_entity
                            set points = points + $4
                            where post_entity.id = $5
                        COMMIT
                        `, [userId, postId, realValue, realValue, postId])
                    */
                    await dataManager.transaction(async (entityManager) => {
                        await entityManager.save(updoot);
                        await entityManager.increment(Post, 
                            { id: postId }, 
                            "points",
                            realValue
                        );
                    })
                    return true;
                } catch (error) {
                    console.log(error.message);
                    return false;
                }
            //the user try to vote on the same post again
            } else {
                return false;
            }
        }
    },
    Post: {
        //this would be a field resolver for type-graphql
        textSnippet: (post) => post.text.slice(0, 50), 
        creator: async ({ creatorId }, _, { userLoader }) => {
            //run a sql query for every post -> poor performance for large data
            //const user = await dataManager.findOneBy(User, { id: post.creatorId })
            return userLoader.load(creatorId); //batches the queries for the all the posts into one function call
        },
        voteStatus: async ({ id }, _, { updootLoader, req }) => {
            if (!req.session.userId) {
                return null;
            }
            console.log('hehre')
            const updoot = await updootLoader.load({
                postId: id,
                userId: req.session.userId,
            });
            return updoot ? updoot.value : null;
        }
    }
}

export default PostResolver;