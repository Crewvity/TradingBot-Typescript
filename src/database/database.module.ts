import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StrategyVariantEntity } from './entities/strategy-variant.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StrategyVariantEntity])],
  exports: [TypeOrmModule],
})
export class DatabaseMoodule {}
