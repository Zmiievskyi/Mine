import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';
import { UserNode } from './user-node.entity';
import { NodeRequest } from '../../requests/entities/node-request.entity';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ nullable: true })
  name: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({ default: true })
  isActive: boolean;

  // Communication preferences
  @Column({ type: 'varchar', length: 100, nullable: true })
  telegram: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  discord: string | null;

  @Column({ name: 'currency_preference', default: 'USD' })
  currencyPreference: string;

  @OneToMany(() => UserNode, (userNode) => userNode.user)
  nodes: UserNode[];

  @OneToMany(() => NodeRequest, (request) => request.user)
  requests: NodeRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
