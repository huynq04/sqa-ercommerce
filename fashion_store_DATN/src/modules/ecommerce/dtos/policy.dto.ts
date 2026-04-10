import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PolicyType } from '@modules/ecommerce/entities/policyDocument.entity';

export class CreatePolicyDto {
  @ApiProperty({ example: 'Chính sách đổi trả' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    enum: PolicyType,
    example: PolicyType.RETURN,
    description:
      'Loại chính sách: return_policy | warranty_policy | privacy_policy | terms',
  })
  @IsEnum(PolicyType)
  type: PolicyType;

  @ApiProperty({ example: 'Nội dung chi tiết của chính sách đổi trả...' })
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class UpdatePolicyDto {
  @ApiProperty({ example: 'Chính sách đổi trả (Cập nhật)', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({
    enum: PolicyType,
    required: false,
    example: PolicyType.RETURN,
  })
  @IsOptional()
  @IsEnum(PolicyType)
  type?: PolicyType;

  @ApiProperty({ example: 'Nội dung chi tiết mới...', required: false })
  @IsOptional()
  @IsString()
  content?: string;
}
