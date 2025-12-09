import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';
import { UserNode } from '../users/entities/user-node.entity';
import { NodeRequest } from '../requests/entities/node-request.entity';
import { NodesService, HyperfusionNode } from '../nodes/nodes.service';

@Injectable()
export class AdminExportService {
  private readonly logger = new Logger(AdminExportService.name);

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(UserNode)
    private userNodesRepository: Repository<UserNode>,
    @InjectRepository(NodeRequest)
    private requestsRepository: Repository<NodeRequest>,
    private nodesService: NodesService,
  ) {}

  async exportUsersCsv(): Promise<string> {
    const users = await this.usersRepository.find({
      relations: ['nodes'],
      order: { createdAt: 'DESC' },
    });

    const headers = ['ID', 'Email', 'Name', 'Role', 'Active', 'Node Count', 'Created At'];
    const rows = users.map((user) => [
      user.id,
      user.email,
      user.name || '',
      user.role,
      user.isActive ? 'Yes' : 'No',
      user.nodes?.length || 0,
      user.createdAt.toISOString(),
    ]);

    return this.toCsv(headers, rows);
  }

  async exportNodesCsv(): Promise<string> {
    const allNodes = await this.userNodesRepository.find({
      where: { isActive: true },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const allHyperfusionNodes = await this.fetchAllHyperfusionNodes();
    const statsMap = new Map(allHyperfusionNodes.map((s) => [s.address, s]));

    const headers = ['ID', 'Node Address', 'User Email', 'GPU Type', 'Status', 'Earnings (GNK)', 'Inference Count', 'Missed Rate', 'Created At'];
    const rows = allNodes.map((node) => {
      const stats = statsMap.get(node.nodeAddress);
      const status = this.getNodeStatus(stats);
      return [
        node.id,
        node.nodeAddress,
        node.user?.email || '',
        node.gpuType || '',
        status,
        stats ? parseFloat(stats.earned_coins).toFixed(2) : '0',
        stats?.inference_count || 0,
        stats?.missed_rate || 0,
        node.createdAt.toISOString(),
      ];
    });

    return this.toCsv(headers, rows);
  }

  async exportRequestsCsv(): Promise<string> {
    const requests = await this.requestsRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });

    const headers = ['ID', 'User Email', 'GPU Type', 'GPU Count', 'Region', 'Status', 'Admin Notes', 'Created At', 'Processed At'];
    const rows = requests.map((req) => [
      req.id,
      req.user?.email || '',
      req.gpuType,
      req.gpuCount,
      req.region || '',
      req.status,
      req.adminNotes || '',
      req.createdAt.toISOString(),
      req.processedAt?.toISOString() || '',
    ]);

    return this.toCsv(headers, rows);
  }

  private async fetchAllHyperfusionNodes(): Promise<HyperfusionNode[]> {
    try {
      return await this.nodesService.getAllHyperfusionNodes();
    } catch {
      return [];
    }
  }

  private getNodeStatus(stats?: HyperfusionNode): 'healthy' | 'jailed' | 'offline' | 'unknown' {
    if (!stats) return 'unknown';
    if (stats.is_offline) return 'offline';
    if (stats.is_jailed) return 'jailed';
    return 'healthy';
  }

  private toCsv(headers: string[], rows: (string | number)[][]): string {
    const escapeCsvField = (field: string | number): string => {
      const str = String(field);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headerLine = headers.map(escapeCsvField).join(',');
    const dataLines = rows.map((row) => row.map(escapeCsvField).join(','));
    return [headerLine, ...dataLines].join('\n');
  }
}
