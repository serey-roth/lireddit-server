import { UserEntity as User } from "../entities/User";
import argon2 from "argon2";
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from "../constants";
import { validateRegister } from "../util/validateRegister";
import { sendEmail } from "../util/sendEmail";
import { v4 as uuid4 } from "uuid";
import { dataManager } from "../AppDataSource";
import { Resolvers } from "src/util/resolvers-types";

const UserResolver: Resolvers = {
    Query: {
        me(_, __, { req }) {
            if (!req.session.userId) {
                return null;
            } 
            return dataManager.findOneBy(User, 
                { id: req.session.userId });
        }
    },
    Mutation: {
        async changePassword(_, 
            { token, newPassword }, 
            { redis, req }
        ) {
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
        },
        async forgetPassword(_, { email }, { redis }) {
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
            return true;
        },
        async register(_, { options }, { req }) {
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
        },
        async login(_, { usernameOrEmail, password }, { req }) {
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
        },
        logout(_, __, { req, res }) {
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
    },
}

export default UserResolver;