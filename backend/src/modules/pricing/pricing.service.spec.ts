import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { PricingService } from './pricing.service';
import { PricingConfig } from './entities/pricing-config.entity';
import { UpdatePricingDto } from './dto';
import { User, UserRole } from '../users/entities/user.entity';

describe('PricingService', () => {
  let service: PricingService;
  let pricingRepository: jest.Mocked<Repository<PricingConfig>>;

  const mockAdminUser: User = {
    id: 'admin-123',
    email: 'admin@minegnk.com',
    password: 'hashedPassword',
    name: 'Admin User',
    role: UserRole.ADMIN,
    isActive: true,
    avatarUrl: null,
    provider: 'local',
    nodes: [],
    requests: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPricingConfig: PricingConfig = {
    id: 'pricing-123',
    gpuType: 'RTX 4090',
    pricePerHour: '1.6700',
    isContactSales: false,
    displayOrder: 1,
    isActive: true,
    updatedBy: mockAdminUser,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  const mockContactSalesConfig: PricingConfig = {
    id: 'pricing-456',
    gpuType: 'H200',
    pricePerHour: null,
    isContactSales: true,
    displayOrder: 3,
    isActive: true,
    updatedBy: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-15'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PricingService,
        {
          provide: getRepositoryToken(PricingConfig),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PricingService>(PricingService);
    pricingRepository = module.get(getRepositoryToken(PricingConfig));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getAllPricing', () => {
    it('should return all pricing configs with updatedBy relation', async () => {
      const mockConfigs = [mockPricingConfig, mockContactSalesConfig];
      pricingRepository.find.mockResolvedValue(mockConfigs);

      const result = await service.getAllPricing();

      expect(pricingRepository.find).toHaveBeenCalledWith({
        relations: ['updatedBy'],
        order: { displayOrder: 'ASC' },
      });
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockPricingConfig.id,
        gpuType: mockPricingConfig.gpuType,
        pricePerHour: 1.67,
        isContactSales: false,
        displayOrder: 1,
        isActive: true,
        updatedAt: mockPricingConfig.updatedAt,
        updatedByEmail: mockAdminUser.email,
      });
      expect(result[1]).toEqual({
        id: mockContactSalesConfig.id,
        gpuType: mockContactSalesConfig.gpuType,
        pricePerHour: null,
        isContactSales: true,
        displayOrder: 3,
        isActive: true,
        updatedAt: mockContactSalesConfig.updatedAt,
        updatedByEmail: undefined,
      });
    });

    it('should return empty array when no pricing configs exist', async () => {
      pricingRepository.find.mockResolvedValue([]);

      const result = await service.getAllPricing();

      expect(result).toEqual([]);
    });

    it('should order results by displayOrder ascending', async () => {
      const mockConfigs = [mockPricingConfig];
      pricingRepository.find.mockResolvedValue(mockConfigs);

      await service.getAllPricing();

      expect(pricingRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          order: { displayOrder: 'ASC' },
        }),
      );
    });
  });

  describe('getPublicPricing', () => {
    it('should return only active pricing configs', async () => {
      const activeConfig = { ...mockPricingConfig, isActive: true };
      const inactiveConfig = { ...mockContactSalesConfig, isActive: false };
      pricingRepository.find.mockResolvedValue([activeConfig]);

      const result = await service.getPublicPricing();

      expect(pricingRepository.find).toHaveBeenCalledWith({
        where: { isActive: true },
        order: { displayOrder: 'ASC' },
      });
      expect(result).toHaveLength(1);
      expect(result[0].gpuType).toBe(activeConfig.gpuType);
    });


    it('should convert decimal string to number', async () => {
      pricingRepository.find.mockResolvedValue([mockPricingConfig]);

      const result = await service.getPublicPricing();

      expect(result[0]).toEqual({
        gpuType: 'RTX 4090',
        pricePerHour: 1.67,
        isContactSales: false,
        displayOrder: 1,
      });
      expect(typeof result[0].pricePerHour).toBe('number');
    });

    it('should handle null pricePerHour correctly', async () => {
      pricingRepository.find.mockResolvedValue([mockContactSalesConfig]);

      const result = await service.getPublicPricing();

      expect(result[0]).toEqual({
        gpuType: 'H200',
        pricePerHour: null,
        isContactSales: true,
        displayOrder: 3,
      });
    });

    it('should exclude admin metadata from public response', async () => {
      pricingRepository.find.mockResolvedValue([mockPricingConfig]);

      const result = await service.getPublicPricing();

      expect(result[0]).not.toHaveProperty('id');
      expect(result[0]).not.toHaveProperty('updatedBy');
      expect(result[0]).not.toHaveProperty('updatedAt');
      expect(result[0]).not.toHaveProperty('updatedByEmail');
    });
  });

  describe('updatePricing', () => {
    it('should update price per hour', async () => {
      const updateDto: UpdatePricingDto = { pricePerHour: 2.5 };
      const updatedConfig = { ...mockPricingConfig, pricePerHour: '2.5000' };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updatePricing('RTX 4090', updateDto, 'admin-123');

      expect(pricingRepository.findOne).toHaveBeenCalledWith({
        where: { gpuType: 'RTX 4090' },
        relations: ['updatedBy'],
      });
      expect(pricingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          pricePerHour: '2.5',
        }),
      );
      expect(result.pricePerHour).toBe(2.5);
    });

    it('should set isContactSales flag', async () => {
      const updateDto: UpdatePricingDto = { isContactSales: true, pricePerHour: null };
      const updatedConfig = {
        ...mockPricingConfig,
        isContactSales: true,
        pricePerHour: null,
      };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updatePricing('RTX 4090', updateDto, 'admin-123');

      expect(pricingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isContactSales: true,
          pricePerHour: null,
        }),
      );
      expect(result.isContactSales).toBe(true);
      expect(result.pricePerHour).toBeNull();
    });

    it('should update isActive status', async () => {
      const updateDto: UpdatePricingDto = { isActive: false };
      const updatedConfig = { ...mockPricingConfig, isActive: false };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updatePricing('RTX 4090', updateDto, 'admin-123');

      expect(pricingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          isActive: false,
        }),
      );
      expect(result.isActive).toBe(false);
    });

    it('should track updatedBy user', async () => {
      const updateDto: UpdatePricingDto = { pricePerHour: 2.0 };
      const updatedConfig = { ...mockPricingConfig, updatedBy: mockAdminUser };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updatePricing('RTX 4090', updateDto, 'admin-456');

      expect(pricingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          updatedBy: { id: 'admin-456' },
        }),
      );
      expect(result.updatedByEmail).toBe(mockAdminUser.email);
    });

    it('should handle partial updates', async () => {
      const updateDto: UpdatePricingDto = { isActive: true };
      const updatedConfig = { ...mockPricingConfig, isActive: true };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      await service.updatePricing('RTX 4090', updateDto, 'admin-123');

      expect(pricingRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({
          // Should keep original price
          pricePerHour: mockPricingConfig.pricePerHour,
          // Should keep original contact sales flag
          isContactSales: mockPricingConfig.isContactSales,
          // Should update isActive
          isActive: true,
        }),
      );
    });

    it('should throw NotFoundException for unknown GPU type', async () => {
      const updateDto: UpdatePricingDto = { pricePerHour: 2.0 };
      pricingRepository.findOne.mockResolvedValue(null);

      await expect(
        service.updatePricing('UNKNOWN_GPU', updateDto, 'admin-123'),
      ).rejects.toThrow(new NotFoundException('Pricing config for UNKNOWN_GPU not found'));

      expect(pricingRepository.findOne).toHaveBeenCalledWith({
        where: { gpuType: 'UNKNOWN_GPU' },
        relations: ['updatedBy'],
      });
      expect(pricingRepository.save).not.toHaveBeenCalled();
    });

    it('should handle setting price to null when switching to contact sales', async () => {
      const updateDto: UpdatePricingDto = {
        pricePerHour: null,
        isContactSales: true,
      };
      const updatedConfig = {
        ...mockPricingConfig,
        pricePerHour: null,
        isContactSales: true,
      };

      pricingRepository.findOne.mockResolvedValue(mockPricingConfig);
      pricingRepository.save.mockResolvedValue(updatedConfig);

      const result = await service.updatePricing('RTX 4090', updateDto, 'admin-123');

      expect(result.pricePerHour).toBeNull();
      expect(result.isContactSales).toBe(true);
    });

  });
});
