import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { PolicyDocument } from '@modules/ecommerce/entities/policyDocument.entity';

@Injectable()
export class UserPolicyService {
  constructor(
    @InjectRepository(PolicyDocument)
    private readonly policyRepo: Repository<PolicyDocument>,
  ) {}

  /** Lấy tất cả chính sách */
  async findAll(): Promise<PolicyDocument[]> {
    return this.policyRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  /** Lấy chi tiết chính sách theo ID */
  async findById(id: number): Promise<PolicyDocument> {
    const policy = await this.policyRepo.findOne({ where: { id } });
    if (!policy) {
      throw new NotFoundException(`Không tìm thấy chính sách với ID: ${id}`);
    }
    return policy;
  }

  async searchByKeyword(keyword: string): Promise<PolicyDocument[]> {
    return this.policyRepo.find({
      where: [
        { title: ILike(`%${keyword}%`) },
        { content: ILike(`%${keyword}%`) },
      ],
      take: 5,
    });
  }
}
