import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export enum RequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum GpuType {
  RTX_3080 = '3080',
  RTX_4090 = '4090',
  H100 = 'H100',
  H200 = 'H200',
}

@Entity('node_requests')
@Index('idx_node_requests_user_id', ['userId'])
@Index('idx_node_requests_status', ['status'])
export class NodeRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, (user) => user.requests)
  @JoinColumn({ name: 'user_id' })
  user: User;

  // Requested GPU type
  @Column({ name: 'gpu_type', type: 'enum', enum: GpuType })
  gpuType: GpuType;

  // Number of GPUs requested
  @Column({ name: 'gpu_count', default: 1 })
  gpuCount: number;

  // Preferred region (optional)
  @Column({ nullable: true })
  region: string;

  // User's message/notes
  @Column({ type: 'text', nullable: true })
  message: string;

  // Request status
  @Column({ type: 'enum', enum: RequestStatus, default: RequestStatus.PENDING })
  status: RequestStatus;

  // Admin response/notes
  @Column({ name: 'admin_notes', type: 'text', nullable: true })
  adminNotes: string;

  // Admin who processed the request
  @Column({ name: 'processed_by', nullable: true })
  processedBy: string;

  @Column({ name: 'processed_at', nullable: true })
  processedAt: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
