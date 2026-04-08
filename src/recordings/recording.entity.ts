import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from "typeorm";
import { User } from "../auth/user.entity";

@Entity()
export class Recording {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ default: "" })
  title: string;

  @Column({ type: "bytea" })
  audioData: Buffer;

  @Column()
  mimeType: string;

  @ManyToOne(() => User, { onDelete: "CASCADE" })
  user: User;

  @CreateDateColumn()
  createdAt: Date;
}