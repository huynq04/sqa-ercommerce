import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PolicyDocument,
  PolicyType,
} from '@modules/ecommerce/entities/policyDocument.entity';
import { AdminPolicyService } from './admin-policy.service';

describe('AdminPolicyService', () => {
  let service: AdminPolicyService;
  let policyRepo: jest.Mocked<Repository<PolicyDocument>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminPolicyService,
        {
          provide: getRepositoryToken(PolicyDocument),
          useValue: {
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(AdminPolicyService);
    policyRepo = module.get(getRepositoryToken(PolicyDocument));
    jest.clearAllMocks();
  });

  // TC-ADMIN-POLICY-SERVICE-01: Tra ve policy khi tim thay
  it('should return policy when policy exists', async () => {
    // Arrange
    const policy = { id: 1, title: 'Shipping policy' } as PolicyDocument;
    policyRepo.findOne.mockResolvedValue(policy);

    // Act
    const result = await service.findOne(1);

    // Assert
    expect(policyRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(policy);
  });

  // TC-ADMIN-POLICY-SERVICE-02: Bao loi khi khong tim thay policy
  it('should throw NotFoundException when policy does not exist', async () => {
    // Arrange
    policyRepo.findOne.mockResolvedValue(null);

    // Act + Assert
    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
    expect(policyRepo.findOne).toHaveBeenCalledWith({ where: { id: 99 } });
  });

  // TC-ADMIN-POLICY-SERVICE-03: Tao policy va luu vao repository
  it('should create policy and save to repository', async () => {
    // Arrange
    const dto: Partial<PolicyDocument> = {
      title: 'Return policy',
      type: PolicyType.RETURN,
    };
    const created = { id: 2, ...dto } as PolicyDocument;
    policyRepo.create.mockReturnValue(created);
    policyRepo.save.mockResolvedValue(created);

    // Act
    const result = await service.create(dto);

    // Assert
    expect(policyRepo.create).toHaveBeenCalledWith(dto);
    expect(policyRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  // TC-ADMIN-POLICY-SERVICE-04: Cap nhat policy va luu lai
  it('should update policy fields and save', async () => {
    // Arrange
    const existing = {
      id: 5,
      title: 'Old',
      type: PolicyType.TERMS,
    } as PolicyDocument;
    policyRepo.findOne.mockResolvedValue(existing);
    policyRepo.save.mockImplementation(async (value: PolicyDocument) => value);

    // Act
    const result = await service.update(5, { title: 'New title' });

    // Assert
    expect(policyRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(policyRepo.save).toHaveBeenCalledWith(existing);
    expect(result.title).toBe('New title');
  });

  // TC-ADMIN-POLICY-SERVICE-05: Xoa policy va tra ve thong bao
  it('should remove policy and return message', async () => {
    // Arrange
    const existing = {
      id: 5,
      title: 'Warranty policy',
    } as PolicyDocument;
    policyRepo.findOne.mockResolvedValue(existing);
    policyRepo.remove.mockResolvedValue(existing);

    // Act
    const result = await service.remove(5);

    // Assert
    expect(policyRepo.findOne).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(policyRepo.remove).toHaveBeenCalledWith(existing);
    expect(result.message).toContain('Warranty policy');
  });
});
