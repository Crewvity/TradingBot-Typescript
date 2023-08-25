import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { CoincapService } from 'src/market-data/services/coincap.service';
import { MarketDataService } from 'src/market-data/services/market-data.service';

@Module({
  imports: [
    ConfigModule,
    EventEmitterModule.forRoot(),
    ScheduleModule.forRoot(),
  ],
  providers: [CoincapService, MarketDataService],
  exports: [MarketDataService],
})
export class MarketDataModule {}
