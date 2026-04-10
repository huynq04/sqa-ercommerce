import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PolicyDocument,
  PolicyType,
} from '@modules/ecommerce/entities/policyDocument.entity';

@Injectable()
export class AdminPolicyService {
  constructor(
    @InjectRepository(PolicyDocument)
    private readonly policyRepo: Repository<PolicyDocument>,
  ) {}

  async findOne(id: number): Promise<PolicyDocument> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Không tìm thấy chính sách ID: ${id}`);
    }
    return policy;
  }

  /** Tạo mới chính sách */
  async create(data: Partial<PolicyDocument>): Promise<PolicyDocument> {
    if (data.type && typeof data.type === 'string') {
      data.type = data.type as PolicyType;
    }
    const newPolicy = this.policyRepo.create(data);
    return this.policyRepo.save(newPolicy);
  }

  /** Cập nhật chính sách */
  async update(
    id: number,
    data: Partial<PolicyDocument>,
  ): Promise<PolicyDocument> {
    const policy = await this.findOne(id);

    if (data.type && typeof data.type === 'string') {
      data.type = data.type as PolicyType;
    }

    Object.assign(policy, data);
    return this.policyRepo.save(policy);
  }

  /** Xóa chính sách */
  async remove(id: number): Promise<{ message: string }> {
    const policy = await this.findOne(id);
    await this.policyRepo.remove(policy);
    return { message: `Đã xóa chính sách "${policy.title}"` };
  }
}
