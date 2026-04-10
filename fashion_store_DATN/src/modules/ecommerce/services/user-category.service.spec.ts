import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserCategoryService } from './user-category.service';
import { Category } from '../entities/category.entity';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';

describe('UserCategoryService', () => {
	let service: UserCategoryService;
	let categoryRepository: Repository<Category>;

	beforeEach(async () => {
		const module: TestingModule = await Test.createTestingModule({
			providers: [
				UserCategoryService,
				{
					provide: getRepositoryToken(Category),
					useValue: {
						findOne: jest.fn(),
					},
				},
			],
		}).compile();

		service = module.get<UserCategoryService>(UserCategoryService);
		categoryRepository = module.get<Repository<Category>>(getRepositoryToken(Category));
	});

	afterEach(() => {
		// Reset tất cả mock sau mỗi test để không ảnh hưởng các test khác
		jest.clearAllMocks();
	});

	/**
	 * =====================================
	 * Test findAll()
	 * =====================================
	 */
	describe('findAll', () => {
		it('TC-001: sets searchFields and calls listPaginate with relations', async () => {
			const expectedCategories = [{ id: 1 } as Category];

			// Mock phương thức private listPaginate
			jest.spyOn(service as any, 'listPaginate').mockResolvedValue(expectedCategories);

			const query: any = {};
			const result = await service.findAll(query);

			// Verify: kết quả trả về đúng danh sách
			expect(result).toBe(expectedCategories);

			// Verify: searchFields được set đúng
			expect(query.searchFields).toEqual(['name', 'description']);

			// Verify: listPaginate được gọi với relations đầy đủ
			expect((service as any).listPaginate).toHaveBeenCalledWith(query, {
				relations: ['parent', 'children', 'products'],
			});

			// CheckDB: với listPaginate mock → không thay đổi DB
			// Rollback: không cần vì không có thay đổi DB thực tế
		});
	});

	/**
	 * =====================================
	 * Test findById()
	 * =====================================
	 */
	describe('findById', () => {
		it('TC-002: returns category when found', async () => {
			const mockCategory = { id: 5 } as Category;

			(categoryRepository.findOne as jest.Mock).mockResolvedValue(mockCategory);

			const result = await service.findById(5);

			// Verify: trả về đúng category
			expect(result).toBe(mockCategory);

			// Verify: repository được gọi đúng với relations
			expect(categoryRepository.findOne).toHaveBeenCalledWith({
				where: { id: 5 },
				relations: ['parent', 'children', 'products'],
			});

			// CheckDB: mock → không truy cập DB thực tế
		});

		it('TC-003: throws NotFoundException when category not found', async () => {
			(categoryRepository.findOne as jest.Mock).mockResolvedValue(undefined);

			// Verify: ném lỗi NotFoundException
			await expect(service.findById(99)).rejects.toThrow(NotFoundException);
		});
	});
});