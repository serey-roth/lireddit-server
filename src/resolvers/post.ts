import { Post } from "../entities/Post";
import { Arg, Ctx, Field, InputType, Mutation, Query, Resolver, UseMiddleware} from "type-graphql";
import { dataManager } from '../AppDataSource';
import { MyContext } from "../types";
import { isAuth } from "../middleware/isAuth";

/* 
resolvers with mikroorm
@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts(
        @Ctx()
        { em }: MyContext
    ): Promise<Post[]> {
        //await sleep(3000); //artificial timeout
        return em.find(Post, {});
    }

    @Query(() => Post, { nullable: true }) //graphql query returns Post or null
    post(
        @Arg('id') id: number,
        @Ctx() { em }: MyContext
    ): Promise<Post | null> {
        return em.findOne(Post, { id });
    }

    @Mutation(() => Post)
    async createPost(
        @Arg('title') title: string,
        @Ctx() { em }: MyContext
    ): Promise<Post> {
        const post = em.create(Post, {
            title,
            createdAt: "",
            updatedAt: ""
        });
        await em.persistAndFlush(post);
        return post;
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, { nullable: true }) title: string,
        @Ctx() { em }: MyContext
    ): Promise<Post | null> {
        const post = await em.findOne(Post, { id });
        if (!post) {
            return null;
        }
        if (typeof title !== 'undefined') {
            post.title = title;
            await em.persistAndFlush(post);
        }
        return post;
    }


    @Mutation(() => Boolean)
    async deletePost(
        @Arg('id') id: number,
        @Ctx() { em }: MyContext
    ): Promise<boolean> {
        await em.nativeDelete(Post, { id });
        return true;
    }    
} */

@InputType() 
class PostInput {
    @Field()
    title: string;
    @Field()
    text: string;
}

@Resolver()
export class PostResolver {
    @Query(() => [Post])
    posts() {
        return dataManager.find(Post);
    }

    @Query(() => Post, { nullable: true }) //graphql query returns Post or null
    post(@Arg('id') id: number) {
        return dataManager.findOneBy(Post, { id });    
    }

    @Mutation(() => Post)
    @UseMiddleware(isAuth)
    async createPost(
        @Arg('input') input: PostInput,
        @Ctx() { req }: MyContext
    ) {
        const post = dataManager.create(Post, { 
            ...input,
            creatorId: req.session.userId,
        });
        try {
            return await dataManager.save(post);
        } catch (error) {
            throw new Error(error.message)
        }
    }

    @Mutation(() => Post, { nullable: true })
    async updatePost(
        @Arg('id') id: number,
        @Arg('title', () => String, { nullable: true }) title: string
    ) {
        const post = await dataManager.findOneBy(Post, { id });
        if (!post) {
            return null;
        }
        if (typeof title !== 'undefined') {
            await dataManager.update(Post, { id }, { title });
        }
        return post;
    }

    @Mutation(() => Boolean)
    async deletePost(@Arg('id') id: number) {
        await dataManager.delete(Post, id);
        return true;
    }    
}