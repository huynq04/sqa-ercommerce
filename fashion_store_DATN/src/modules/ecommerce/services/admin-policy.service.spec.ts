import { NotFoundException } from '@nestjs/common';
import { beforeEach, describe, expect, it, jest } from '@jest/globals';

import { AdminPolicyService } from './admin-policy.service';

const createPolicyRepoMock = () => ({
  findOne: jest.fn<(...args: any[]) => any>(),
  create: jest.fn<(...args: any[]) => any>(),
  save: jest.fn<(...args: any[]) => any>(),
  remove: jest.fn<(...args: any[]) => any>(),
});

describe('AdminPolicyService', () => {
  let service: AdminPolicyService;
  let policyRepo: ReturnType<typeof createPolicyRepoMock>;

  beforeEach(() => {
    policyRepo = createPolicyRepoMock();
    service = new AdminPolicyService(policyRepo as any);
  });

  it('findOne returns policy when found', async () => {
    const policy = { id: 1, title: 'Shipping policy' };
    policyRepo.findOne.mockResolvedValue(policy);

    const result = await service.findOne(1);

    expect(policyRepo.findOne).toHaveBeenCalledWith({ where: { id: 1 } });
    expect(result).toBe(policy);
  });

  it('findOne throws NotFoundException when policy does not exist', async () => {
    policyRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(99)).rejects.toThrow(NotFoundException);
  });

  it('create casts type and saves new policy', async () => {
    const dto = { title: 'Return policy', type: 'RETURN' as any };
    const created = { id: 2, ...dto };
    policyRepo.create.mockReturnValue(created);
    policyRepo.save.mockResolvedValue(created);

    const result = await service.create(dto as any);

    expect(policyRepo.create).toHaveBeenCalledWith(dto);
    expect(policyRepo.save).toHaveBeenCalledWith(created);
    expect(result).toEqual(created);
  });

  it('update merges fields and saves', async () => {
    const existing = { id: 5, title: 'Old', type: 'SHIPPING' };
    policyRepo.findOne.mockResolvedValue(existing);
    policyRepo.save.mockImplementation(async (value: any) => value);

    const result = await service.update(5, { title: 'New title' } as any);

    expect(result.title).toBe('New title');
    expect(policyRepo.save).toHaveBeenCalledWith(existing);
  });

  it('remove deletes policy and returns message', async () => {
    const existing = { id: 5, title: 'Warranty policy' };
    policyRepo.findOne.mockResolvedValue(existing);
    policyRepo.remove.mockResolvedValue(existing);

    const result = await service.remove(5);

    expect(policyRepo.remove).toHaveBeenCalledWith(existing);
    expect(result.message).toContain('Warranty policy');
  });
});
