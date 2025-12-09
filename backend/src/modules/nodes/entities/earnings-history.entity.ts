import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Node } from './node.entity';

/**
 * EarningsHistory entity stores daily earnings per node.
 * Enables historical analysis, trend charts, and earnings verification.
 *
 * Populated by background job that runs daily.
 */
@Entity('earnings_history')
export class EarningsHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'node_id' })
  nodeId: string;

  @ManyToOne(() => Node, (node) => node.earningsHistory)
  @JoinColumn({ name: 'node_id' })
  node: Node;

  @Column({ type: 'date' })
  date: Date;

  @Column({
    name: 'earnings_gnk',
    type: 'decimal',
    precision: 20,
    scale: 8,
  })
  earningsGnk: number;

  @Column({ nullable: true })
  source: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
