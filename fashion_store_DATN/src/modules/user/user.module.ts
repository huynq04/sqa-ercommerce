import { Module } from '@nestjs/common';
import { UsersService } from '@modules/user/services/user.service';
import { UsersController } from '@modules/user/controllers/user.controller';
import { AdminUsersController } from '@modules/user/controllers/admin-user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '@modules/user/entities/user.entity';
import {EcommerceModule} from "@modules/ecommerce/ecommerce.module";

@Module({
  imports: [TypeOrmModule.forFeature([User]),
  ],
  providers: [UsersService],
  controllers: [UsersController, AdminUsersController],
  exports: [UsersService],
})
export class UsersModule {}
