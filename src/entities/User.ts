import { 
    Entity, 
    PrimaryGeneratedColumn, 
    Column, 
    CreateDateColumn, 
    UpdateDateColumn,
    OneToMany, 
} from "typeorm";
import { Field, ObjectType } from "type-graphql";
import { Post } from "./Post";

@ObjectType()
@Entity()
export class User  {
    @Field()
    @PrimaryGeneratedColumn()
    //before with mikroorm use PropertyKey
    id!: number;

    @Field(() => String)
    @CreateDateColumn()
    createdAt: Date;

    @Field(() => String)
    @UpdateDateColumn()
    //with mikroorm use PropertKey gives onUpdate
    updatedAt: Date;

    @Field()
    @Column({ unique: true })
    username!: string;

    @Column()
    password!: string;

    @Field()
    @Column({ unique: true })
    email!: string;

    @OneToMany(() => Post, (post) => post.creator)
    posts: Post[];
}