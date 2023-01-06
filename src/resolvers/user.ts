import { User } from "../entities/User";
import { Arg, Ctx, Field, Mutation, ObjectType, Query, Resolver } from "type-graphql";
import { MyContext } from "../types";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { UsernamePasswordInput } from "../util/UsernamePasswordInput";
import { validateRegister } from "../util/validateRegister";
import { sendEmail } from "../util/sendEmail";
import { v4 as uuid4 } from "uuid";
import { dataManager } from "../AppDataSource";

@ObjectType()
class FieldError {
    @Field()
    field: string;
    @Field()
    message: string;
}

@ObjectType() //can return from mutations
class UserResponse {
    @Field(() => [FieldError], { nullable: true}) 
    errors?: FieldError[];

    @Field(() => User, { nullable: true })
    user?: User;
}

/* @Resolver() with mikroorm
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { em, redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length < 2) {
            return {
                errors: [{
                    field: 'newPassword',
                    message: 'length must be greater than 2'
                }]
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token;
        const userid = await redis.get(key);
        if (!userid) {
            return {
                errors: [{
                    field: 'token',
                    message: 'token expired',
                }]
            }
        }

        const user = await em.findOne(User, { id: parseInt(userid) });
        if (!user) {
            return {
                errors: [{
                    field: 'token',
                    message: 'user no longer exists',
                }]
            };
        }

        user.password = await argon2.hash(newPassword);
        await em.persistAndFlush(user);

        await redis.del(key);
        //log in user
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { em, redis }: MyContext
    ) {
        const user  = await em.findOne(User, { email });
        if (!user) {
                return true;
        }

        const token = uuid4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            'EX',
            1000 * 60 * 60 * 24 * 3 //3 days
        );

        sendEmail(email, 
            `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)
        return user;
    }

    @Query(() => User, { nullable: true })
    async me(
        @Ctx() { req, em }: MyContext
    ): Promise<User | null> {
        if (!req.session.userId) {
            return null;
        } 
        const user = await em.findOne(User, { id: req.session.userId });
        return user;
    }

    @Mutation(() => UserResponse) 
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { em, req }:  MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = em.create(User, {
            username: options.username, 
            password: hashedPassword,
            createdAt: "",
            updatedAt: "",
            email: options.email
        });
        
        try {
            await em.persistAndFlush(user);
        } catch (error) {
            //duplicate username error
            if (error.detail.includes('already exists')) {
                if (error.constraint === 'user_email_unique') {
                    return {
                        errors: [{
                            field: 'email',
                            message: 'email already taken!'
                        }]
                    }
                } else {
                    return {
                        errors: [{
                            field: 'username',
                            message: 'username already taken!'
                        }]
                    }
                }                
            }
        }

        //store user id session
        //this will set cookie on client-side
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse) 
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { em, req }:  MyContext
    ): Promise<UserResponse> {
        const user = await em.findOne(User, 
            usernameOrEmail.includes('@') ? 
            { email: usernameOrEmail  }
            : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: "that username/email doesn't exist",
                }]
            }
        }
        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword) {
            return {
                errors: [{
                    field: 'password',
                    message: "incorrect password",
                }]
            }
        }

        req.session.userId = user.id;

        return {
            user
        };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve: any) => 
            req.session.destroy((err) => {
                if (err) {
                    console.log(err.message);
                    resolve(false);
                    return;
                }
                res.clearCookie(COOKIE_NAME);
                resolve(true);
            })
        )
    }
} */

@Resolver()
export class UserResolver {
    @Mutation(() => UserResponse)
    async changePassword(
        @Arg('token') token: string,
        @Arg('newPassword') newPassword: string,
        @Ctx() { redis, req }: MyContext
    ): Promise<UserResponse> {
        if (newPassword.length < 2) {
            return {
                errors: [{
                    field: 'newPassword',
                    message: 'length must be greater than 2'
                }]
            };
        }

        const key = FORGET_PASSWORD_PREFIX + token;
        const userid = await redis.get(key);
        if (!userid) {
            return {
                errors: [{
                    field: 'token',
                    message: 'token expired',
                }]
            }
        }

        const userIdNum = parseInt(userid)
        const user = await dataManager.findOneBy(User, { id: userIdNum });
        if (!user) {
            return {
                errors: [{
                    field: 'token',
                    message: 'user no longer exists',
                }]
            };
        }

        await dataManager.update(User, { id: userIdNum }, {
            password: await argon2.hash(newPassword),
        });

        await redis.del(key);
        //log in user
        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    async forgotPassword(
        @Arg('email') email: string,
        @Ctx() { redis }: MyContext
    ) {
        const user  = await dataManager.findOneBy(User, { email });
        if (!user) {
            return true;
        }

        const token = uuid4();

        await redis.set(
            FORGET_PASSWORD_PREFIX + token,
            user.id,
            'EX',
            1000 * 60 * 60 * 24 * 3 //3 days
        );

        sendEmail(email, 
            `<a href="http://localhost:3000/change-password/${token}">reset password</a>`)
        return user;
    }

    @Query(() => User, { nullable: true })
    me(
        @Ctx() { req }: MyContext
    ) {
        if (!req.session.userId) {
            return null;
        } 
        return dataManager.findOneBy(User, { id: req.session.userId });
    }

    @Mutation(() => UserResponse) 
    async register(
        @Arg('options') options: UsernamePasswordInput,
        @Ctx() { req }:  MyContext
    ): Promise<UserResponse> {
        const errors = validateRegister(options);
        if (errors) {
            return { errors };
        }

        const hashedPassword = await argon2.hash(options.password);
        const user = dataManager.create(User, {
            username: options.username, 
            password: hashedPassword,
            email: options.email
        });
        
        try {
            await dataManager.save(user);
        } catch (error) {
            //duplicate username error
            if (error.detail.includes('already exists')) {
                if (error.constraint === 'user_email_unique') {
                    return {
                        errors: [{
                            field: 'email',
                            message: 'email already taken!'
                        }]
                    }
                } else {
                    return {
                        errors: [{
                            field: 'username',
                            message: 'username already taken!'
                        }]
                    }
                }                
            }
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => UserResponse) 
    async login(
        @Arg('usernameOrEmail') usernameOrEmail: string,
        @Arg('password') password: string,
        @Ctx() { req }:  MyContext
    ): Promise<UserResponse> {
        const user = await dataManager.findOneBy(User, 
            usernameOrEmail.includes('@') ? 
            { email: usernameOrEmail  }
            : { username: usernameOrEmail }
        );
        if (!user) {
            return {
                errors: [{
                    field: 'usernameOrEmail',
                    message: "that username/email doesn't exist",
                }]
            }
        }
        const validPassword = await argon2.verify(user.password, password);
        if (!validPassword) {
            return {
                errors: [{
                    field: 'password',
                    message: "incorrect password",
                }]
            }
        }

        req.session.userId = user.id;

        return { user };
    }

    @Mutation(() => Boolean)
    logout(@Ctx() { req, res }: MyContext) {
        return new Promise((resolve: any) => 
            req.session.destroy((err) => {
                if (err) {
                    resolve(false);
                    return;
                }
                res.clearCookie(COOKIE_NAME);
                resolve(true);
            })
        )
    }
}