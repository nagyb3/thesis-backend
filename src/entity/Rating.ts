import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { User } from "./User";

@Entity()
export class Rating {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  score: number;

  @ManyToOne(() => User, (user) => user.ratingsgiven)
  givenby: User;

  @ManyToOne(() => User, (user) => user.ratingsreceived)
  givento: User;
}
