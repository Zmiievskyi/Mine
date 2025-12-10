import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

@Entity('pricing_config')
export class PricingConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'gpu_type', unique: true })
  gpuType: string;

  @Column({
    name: 'price_per_hour',
    type: 'decimal',
    precision: 10,
    scale: 4,
    nullable: true,
  })
  pricePerHour: string | null;

  @Column({ name: 'is_contact_sales', default: false })
  isContactSales: boolean;

  @Column({ name: 'display_order', default: 0 })
  displayOrder: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'updated_by' })
  updatedBy: User | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
