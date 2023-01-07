import { 
    Entity, 
    Column, 
    CreateDateColumn, 
    PrimaryGeneratedColumn, 
    UpdateDateColumn,
    ManyToOne,
} from "typeorm";
import { UserEntity as User } from "./User";

@Entity() //correspond to a psql database table
export class PostEntity {
    @PrimaryGeneratedColumn()
    id!: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @Column()
    title!: string;

    @Column()
    creatorId: number;

    @ManyToOne(() => User, (user) => user.posts)
    creator: User;

    @Column()
    text!: string;

    @Column({ type: "int", default: 0 })
    points!: number;
}