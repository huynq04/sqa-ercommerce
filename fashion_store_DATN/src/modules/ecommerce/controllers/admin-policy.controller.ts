import {
  Controller,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Get,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AdminPolicyService } from '@modules/ecommerce/services/admin-policy.service';
import {
  CreatePolicyDto,
  UpdatePolicyDto,
} from '@modules/ecommerce/dtos/policy.dto';

@ApiTags('Admin/Policies')
@Controller('admin/policies')
export class AdminPolicyController {
  constructor(private readonly policyService: AdminPolicyService) {}

  @Post()
  create(@Body() dto: CreatePolicyDto) {
    return this.policyService.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: number, @Body() dto: UpdatePolicyDto) {
    return this.policyService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: number) {
    return this.policyService.remove(id);
  }
}
