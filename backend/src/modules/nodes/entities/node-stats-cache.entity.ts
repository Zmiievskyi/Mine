import {
  Entity,
  Column,
  PrimaryColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import { Node } from './node.entity';

/**
 * NodeStatsCache entity stores cached statistics from Gonka trackers.
 * This eliminates the need to hit external APIs on every request,
 * improving performance and reliability.
 *
 * Cache TTL: 1-5 minutes (check fetched_at before using)
 */
@Entity('node_stats_cache')
export class NodeStatsCache {
  @PrimaryColumn({ name: 'node_id', type: 'uuid' })
  nodeId: string;

  @OneToOne(() => Node, (node) => node.stats)
  @JoinColumn({ name: 'node_id' })
  node: Node;

  @Column({ nullable: true })
  status: string;

  @Column({
    name: 'earnings_day',
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: true,
  })
  earningsDay: number;

  @Column({
    name: 'earnings_total',
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: true,
  })
  earningsTotal: number;

  @Column({
    name: 'uptime_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  uptimePercent: number;

  @Column({
    name: 'tokens_per_sec',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  tokensPerSec: number;

  @Column({ name: 'jobs_day', nullable: true })
  jobsDay: number;

  @Column({ name: 'active_model', nullable: true })
  activeModel: string;

  @Column({
    name: 'voting_weight',
    type: 'decimal',
    precision: 20,
    scale: 8,
    nullable: true,
  })
  votingWeight: number;

  @Column({ nullable: true })
  source: string;

  @Column({ name: 'fetched_at', type: 'timestamptz' })
  fetchedAt: Date;
}
