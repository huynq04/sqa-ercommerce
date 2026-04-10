import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param } from '@nestjs/common';
import { UserPolicyService } from '@modules/ecommerce/services/user-policy.service';

@ApiTags('Policies')
@Controller('policies')
export class UserPolicyController {
  constructor(private readonly policyService: UserPolicyService) {}

  /** Lấy tất cả chính sách */
  @Get()
  getAll() {
    return this.policyService.findAll();
  }

  /** Lấy chi tiết chính sách theo ID */
  @Get(':id')
  getById(@Param('id') id: number) {
    return this.policyService.findById(id);
  }
}
