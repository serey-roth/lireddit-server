"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Updoot_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Updoot = void 0;
const typeorm_1 = require("typeorm");
const User_1 = require("./User");
const Post_1 = require("./Post");
let Updoot = Updoot_1 = class Updoot {
    value;
    userId;
    user;
    postId;
    post;
    updoots;
};
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Updoot.prototype, "value", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], Updoot.prototype, "userId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => User_1.UserEntity, (user) => user.updoots),
    __metadata("design:type", User_1.UserEntity)
], Updoot.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.PrimaryColumn)(),
    __metadata("design:type", Number)
], Updoot.prototype, "postId", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => Post_1.PostEntity, (post) => post.updoots),
    __metadata("design:type", Post_1.PostEntity)
], Updoot.prototype, "post", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => Updoot_1, (updoot) => updoot.post),
    __metadata("design:type", Array)
], Updoot.prototype, "updoots", void 0);
Updoot = Updoot_1 = __decorate([
    (0, typeorm_1.Entity)()
], Updoot);
exports.Updoot = Updoot;
//# sourceMappingURL=Updoot.js.map