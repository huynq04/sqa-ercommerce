import { IsEnum, IsNotEmpty } from 'class-validator';
import { Role } from '@modules/auth/role.enum';

export class UpgradeUserDto {
  @IsNotEmpty()
  userId: number;

  @IsNotEmpty()
  @IsEnum(Role)
  role: Role;
}
