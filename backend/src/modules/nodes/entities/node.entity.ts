import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { NodeStatsCache } from './node-stats-cache.entity';
import { EarningsHistory } from './earnings-history.entity';

export enum IdentifierType {
  WALLET = 'wallet',
  NODE_ID = 'node_id',
  OPERATOR = 'operator',
  VALIDATOR = 'validator',
}

/**
 * Node entity represents the canonical node reference data.
 * This separates node identity from user assignments, enabling:
 * - Multiple users to share access to a node
 * - Node lifecycle management independent of users
 * - Cleaner admin audit trail
 *
 * NOTE: The relation to UserNode will be added in Phase 2 when
 * user_nodes table is refactored to be a pure join table.
 */
@Entity('nodes')
export class Node {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  identifier: string;

  @Column({
    name: 'identifier_type',
    type: 'varchar',
    length: 50,
  })
  identifierType: IdentifierType;

  @Column({ name: 'display_name', nullable: true })
  displayName: string;

  @Column({ name: 'gpu_type', nullable: true })
  gpuType: string;

  @Column({ nullable: true })
  region: string;

  @Column({ name: 'gcore_instance_id', nullable: true })
  gcoreInstanceId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToOne(() => NodeStatsCache, (stats) => stats.node)
  stats: NodeStatsCache;

  @OneToMany(() => EarningsHistory, (earnings) => earnings.node)
  earningsHistory: EarningsHistory[];
}
