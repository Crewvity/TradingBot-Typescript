import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CrewvityService } from 'src/crewvity/services/crewvity.service';

@Module({
  imports: [ConfigModule],
  providers: [CrewvityService],
  exports: [CrewvityService],
})
export class CrewvityModule {}
