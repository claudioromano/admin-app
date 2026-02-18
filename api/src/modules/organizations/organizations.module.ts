import { Module } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { OrganizationsController } from './organizations.controller';
import { MembersService } from './members.service';
import { MembersController } from './members.controller';

@Module({
  controllers: [OrganizationsController, MembersController],
  providers: [OrganizationsService, MembersService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
