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

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
  GITHUB = 'github',
  TELEGRAM = 'telegram',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', unique: true, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', nullable: true })
  @Exclude()
  password: string | null;

  @Column({ type: 'varchar', nullable: true })
  name: string | null;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Column({
    type: 'enum',
    enum: AuthProvider,
    default: AuthProvider.LOCAL,
  })
  provider: AuthProvider;

  @Column({ type: 'varchar', nullable: true, unique: true })
  googleId: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true })
  githubId: string | null;

  @Column({ type: 'varchar', nullable: true, unique: true, name: 'telegram_id' })
  telegramId: string | null;

  @Column({ type: 'varchar', nullable: true, name: 'telegram_username' })
  telegramUsername: string | null;

  @Column({ type: 'varchar', nullable: true })
  avatarUrl: string | null;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: true })
  emailVerified: boolean;

  @Column({ type: 'varchar', length: 6, nullable: true })
  @Exclude()
  verificationCode: string | null;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  verificationCodeExpiresAt: Date | null;

  @Column({ default: 0 })
  @Exclude()
  verificationAttempts: number;

  @Column({ type: 'timestamp with time zone', nullable: true })
  @Exclude()
  verificationLockedUntil: Date | null;

  @OneToMany(() => UserNode, (userNode) => userNode.user)
  nodes: UserNode[];

  @OneToMany(() => NodeRequest, (request) => request.user)
  requests: NodeRequest[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
