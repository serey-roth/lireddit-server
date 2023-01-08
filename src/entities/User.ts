import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany, 
} from "typeorm";
import { PostEntity as Post } from "./Post";
import { Updoot } from "./Updoot";

@Entity()
export class UserEntity {
    @PrimaryGeneratedColumn()
    //before with mikroorm use PropertyKey
    id!: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    //with mikroorm use PropertKey gives onUpdate
    updatedAt: Date;

    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Column({ unique: true })
    email!: string;

    @OneToMany(() => Post, (post) => post.creator)
    posts: Post[];

    @OneToMany(() => Updoot, (updoot) => updoot.user)
    updoots: Updoot[]; //kinda like upvotes --> a user can have many upvotes
}