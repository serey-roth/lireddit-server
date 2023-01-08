import { 
    Entity, 
    Column, 
    ManyToOne,
    OneToMany,
    PrimaryColumn,
} from "typeorm";
import { UserEntity as User } from "./User";
import { PostEntity as Post } from "./Post";

// many to many relationship
// user <-> posts 
//// many users can upvote a single post
//// a user can upvote many post
/// user ->  join table <- posts
/// join table = updoot


@Entity() //correspond to a psql database table
export class Updoot {
    @Column()
    value: number;
    
    @PrimaryColumn()
    userId: number;

    @ManyToOne(() => User, (user) => user.updoots)
    user: User;

    @PrimaryColumn()
    postId: number;

    @ManyToOne(() => Post, (post) => post.updoots)
    post: Post;

    @OneToMany(() => Updoot, (updoot) => updoot.post)
    updoots: Updoot[]; // a post can have many upvotes
}