"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postMiddleware = void 0;
const isAuth_1 = require("./isAuth");
exports.postMiddleware = {
    Mutation: {
        createPost: isAuth_1.isAuth,
        updatePost: isAuth_1.isAuth,
        deletePost: isAuth_1.isAuth,
        vote: isAuth_1.isAuth,
    }
};
//# sourceMappingURL=post.js.map