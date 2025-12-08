import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

@Entity('user_nodes')
export class UserNode {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.nodes)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Gonka node address (e.g., "gonka1xyz...")
  @Column({ name: 'node_address', unique: true })
  nodeAddress: string;

  // Human-readable label set by admin
  @Column({ nullable: true })
  label: string;

  // GPU type (set by admin when assigning)
  @Column({ name: 'gpu_type', nullable: true })
  gpuType: string;

  // Gcore instance ID (optional, for reference)
  @Column({ name: 'gcore_instance_id', nullable: true })
  gcoreInstanceId: string;

  // Notes from admin
  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
