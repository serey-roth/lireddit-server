"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const User_1 = require("../entities/User");
const argon2_1 = __importDefault(require("argon2"));
const constants_1 = require("../constants");
const validateRegister_1 = require("../util/validateRegister");
const sendEmail_1 = require("../util/sendEmail");
const uuid_1 = require("uuid");
const AppDataSource_1 = require("../AppDataSource");
const UserResolver = {
    Query: {
        me(_, __, { req }) {
            if (!req.session.userId) {
                return null;
            }
            return AppDataSource_1.dataManager.findOneBy(User_1.UserEntity, { id: req.session.userId });
        }
    },
    Mutation: {
        async changePassword(_, { token, newPassword }, { redis, req }) {
            if (newPassword.length < 2) {
                return {
                    errors: [{
                            field: 'newPassword',
                            message: 'length must be greater than 2'
                        }]
                };
            }
            const key = constants_1.FORGET_PASSWORD_PREFIX + token;
            const userid = await redis.get(key);
            if (!userid) {
                return {
                    errors: [{
                            field: 'token',
                            message: 'token expired',
                        }]
                };
            }
            const userIdNum = parseInt(userid);
            const user = await AppDataSource_1.dataManager.findOneBy(User_1.UserEntity, { id: userIdNum });
            if (!user) {
                return {
                    errors: [{
                            field: 'token',
                            message: 'user no longer exists',
                        }]
                };
            }
            await AppDataSource_1.dataManager.update(User_1.UserEntity, { id: userIdNum }, {
                password: await argon2_1.default.hash(newPassword),
            });
            await redis.del(key);
            req.session.userId = user.id;
            return { user };
        },
        async forgetPassword(_, { email }, { redis }) {
            const user = await AppDataSource_1.dataManager.findOneBy(User_1.UserEntity, { email });
            if (!user) {
                return true;
            }
            const token = (0, uuid_1.v4)();
            await redis.set(constants_1.FORGET_PASSWORD_PREFIX + token, user.id, 'EX', 1000 * 60 * 60 * 24 * 3);
            (0, sendEmail_1.sendEmail)(email, `<a href="http://localhost:3000/change-password/${token}">reset password</a>`);
            return true;
        },
        async register(_, { options }, { req }) {
            const errors = (0, validateRegister_1.validateRegister)(options);
            if (errors) {
                return { errors };
            }
            const hashedPassword = await argon2_1.default.hash(options.password);
            const user = AppDataSource_1.dataManager.create(User_1.UserEntity, {
                username: options.username,
                password: hashedPassword,
                email: options.email
            });
            try {
                await AppDataSource_1.dataManager.save(user);
            }
            catch (error) {
                if (error.detail.includes('already exists')) {
                    if (error.constraint === 'user_email_unique') {
                        return {
                            errors: [{
                                    field: 'email',
                                    message: 'email already taken!'
                                }]
                        };
                    }
                    else {
                        return {
                            errors: [{
                                    field: 'username',
                                    message: 'username already taken!'
                                }]
                        };
                    }
                }
            }
            req.session.userId = user.id;
            return { user };
        },
        async login(_, { usernameOrEmail, password }, { req }) {
            const user = await AppDataSource_1.dataManager.findOneBy(User_1.UserEntity, usernameOrEmail.includes('@') ?
                { email: usernameOrEmail }
                : { username: usernameOrEmail });
            if (!user) {
                return {
                    errors: [{
                            field: 'usernameOrEmail',
                            message: "that username/email doesn't exist",
                        }]
                };
            }
            const validPassword = await argon2_1.default.verify(user.password, password);
            if (!validPassword) {
                return {
                    errors: [{
                            field: 'password',
                            message: "incorrect password",
                        }]
                };
            }
            req.session.userId = user.id;
            return { user };
        },
        logout(_, __, { req, res }) {
            return new Promise((resolve) => req.session.destroy((err) => {
                if (err) {
                    resolve(false);
                    return;
                }
                res.clearCookie(constants_1.COOKIE_NAME);
                resolve(true);
            }));
        }
    },
};
exports.default = UserResolver;
//# sourceMappingURL=user.js.map