import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserProductService } from './user-product.service';
import { Product } from '../entities/product.entity';
import { ActivityLog } from '../entities/activityLog.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserProductService', () => {
	let service: UserProductService;
	let productRepository: Repository<Product>;
	let activityLogRepository: Repository<ActivityLog>;

	// Mock QueryBuilder chung cho update/insert activity log
	const mockQueryBuilder: any = {
		update: jest.fn().mockReturnThis(),
		set: jest.fn().mockReturnThis(),
		where: jest.fn().mockReturnThis(),
		execute: jest.fn().mockResolvedValue({ affected: 1 }),
		insert: jest.fn().mockReturnThis(),
		values: jest.fn().mockReturnThis(),
	};

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserProductService,
				{
					provide: getRepositoryToken(Product),
					useValue: {
						findOne: jest.fn(),
						find: jest.fn(),
						createQueryBuilder: jest.fn(() => mockQueryBuilder),
					},
				},
				{
					provide: getRepositoryToken(ActivityLog),
					useValue: {
						createQueryBuilder: jest.fn(() => mockQueryBuilder),
					},
				},
			],
		}).compile();

		service = module.get<UserProductService>(UserProductService);
		productRepository = module.get<Repository<Product>>(getRepositoryToken(Product));
		activityLogRepository = module.get<Repository<ActivityLog>>(getRepositoryToken(ActivityLog));
	});

	afterEach(() => {
		// Clear tất cả các mock để không ảnh hưởng test khác
		jest.clearAllMocks();
	});

	/**
	 * =====================================
	 * Test findById()
	 * =====================================
	 */
	describe('findById', () => {
		it('TC-001: should return product if found', async () => {
			// Setup: mock product
			const mockProduct = { id: 1 } as Product;
			(productRepository.findOne as jest.Mock).mockResolvedValue(mockProduct);

			// Action: gọi hàm
			const result = await service.findById(1);

			// Verify: kết quả trả về đúng product
			expect(result).toBe(mockProduct);

			// Verify: repository được gọi đúng với relations
			expect(productRepository.findOne).toHaveBeenCalledWith({
				where: { id: 1 },
				relations: [
					'category',
					'variants',
					'variants.color',
					'variants.size',
					'images',
				],
			});
		});

		it('TC-002: should throw NotFoundException if product not found', async () => {
			(productRepository.findOne as jest.Mock).mockResolvedValue(undefined);

			await expect(service.findById(999)).rejects.toThrow(NotFoundException);
		});
	});

	/**
	 * =====================================
	 * Test searchByKeyword()
	 * =====================================
	 */
	describe('searchByKeyword', () => {
		it('TC-003: should search products by keyword', async () => {
			const keyword = 'test';
			const mockProducts = [{ id: 1 } as Product];

			(productRepository.find as jest.Mock).mockResolvedValue(mockProducts);

			const result = await service.searchByKeyword(keyword);

			// Verify result
			expect(result).toBe(mockProducts);

			// Verify repository được gọi đúng với search condition
			expect(productRepository.find).toHaveBeenCalledWith({
				where: [
					{ name: expect.anything() },
					{ description: expect.anything() },
				],
				take: 5,
			});
		});
	});

	/**
	 * =====================================
	 * Test logProductView()
	 * =====================================
	 */
	describe('logProductView', () => {
		it('TC-004: should do nothing if userId or productId is missing', async () => {
			// CheckDB: không thay đổi DB
			await expect(service.logProductView(undefined as any, 1)).resolves.toBeUndefined();
			await expect(service.logProductView(1, undefined as any)).resolves.toBeUndefined();
		});

		it('TC-005: should update view count if record exists', async () => {
			// Setup: giả lập update thành công
			mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 1 });

			await service.logProductView(1, 2);

			// Verify: update được gọi
			expect(mockQueryBuilder.update).toHaveBeenCalled();
			expect(mockQueryBuilder.set).toHaveBeenCalled();
			expect(mockQueryBuilder.where).toHaveBeenCalled();
			expect(mockQueryBuilder.execute).toHaveBeenCalled();

			// Rollback: không cần rollback vì mock
		});

		it('TC-006: should insert if update did not affect any row', async () => {
			// Setup: giả lập update không affect → insert mới
			mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 0 });
			mockQueryBuilder.insert.mockReturnThis();
			mockQueryBuilder.values.mockReturnThis();
			mockQueryBuilder.execute.mockResolvedValueOnce({});

			await service.logProductView(1, 2);

			expect(mockQueryBuilder.insert).toHaveBeenCalled();
			expect(mockQueryBuilder.values).toHaveBeenCalled();
		});

		it('TC-007: should fallback to update if insert throws duplicate error', async () => {
			// Setup: update không affect, insert lỗi
			mockQueryBuilder.execute.mockResolvedValueOnce({ affected: 0 });
			mockQueryBuilder.insert.mockReturnThis();
			mockQueryBuilder.values.mockReturnThis();
			mockQueryBuilder.execute.mockRejectedValueOnce(new Error('duplicate'));
			mockQueryBuilder.update.mockReturnThis();
			mockQueryBuilder.set.mockReturnThis();
			mockQueryBuilder.where.mockReturnThis();
			mockQueryBuilder.execute.mockResolvedValueOnce({});

			await service.logProductView(1, 2);

			// Verify: update được gọi như fallback
			expect(mockQueryBuilder.update).toHaveBeenCalled();
		});
	});
});