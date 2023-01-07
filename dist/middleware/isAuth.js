"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isAuth = void 0;
const graphql_1 = require("graphql");
const isAuth = (resolve, parent, args, context, info) => {
    if (!context.req.session.userId) {
        throw new graphql_1.GraphQLError("not authenticated", {
            extensions: {
                code: "UNAUTHENTICATED",
            }
        });
    }
    return resolve(parent, args, context, info);
};
exports.isAuth = isAuth;
//# sourceMappingURL=isAuth.js.map