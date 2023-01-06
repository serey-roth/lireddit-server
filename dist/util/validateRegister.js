"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRegister = void 0;
const validateRegister = (options) => {
    if (!options.email.includes('@')) {
        return [
            {
                field: 'email',
                message: 'invalid email'
            }
        ];
    }
    if (options.username.length < 2) {
        return [
            {
                field: 'username',
                message: 'length must be greater than 2'
            }
        ];
    }
    if (options.username.includes('@')) {
        return [
            {
                field: 'username',
                message: 'cannot include @'
            }
        ];
    }
    if (options.password.length < 6) {
        return [
            {
                field: 'password',
                message: 'length must be greater than or equal to 6'
            }
        ];
    }
    return null;
};
exports.validateRegister = validateRegister;
//# sourceMappingURL=validateRegister.js.map