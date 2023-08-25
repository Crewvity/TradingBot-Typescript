import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Config, configSchema, getConfig } from 'src/config/configuration';
import { DatabaseMoodule } from 'src/database/database.module';
import { StrategyModule } from 'src/strategy/strategy.module';
import { CommonsModule } from 'src/commons/commons.module';
import { MarketDataModule } from 'src/market-data/market-data.module';
import { CliCommandModule } from 'src/cli-command/cli-command.module';
import { CrewvityModule } from './crewvity/crewvity.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: false,
      validationSchema: { validate: configSchema.parse },
      load: [getConfig],
    }),
    TypeOrmModule.forRootAsync({
      useFactory: (configService: ConfigService<Config>) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        synchronize: true,
        timezone: 'UTC',
      }),
      inject: [ConfigService],
    }),
    DatabaseMoodule,
    CliCommandModule,
    CommonsModule,
    CrewvityModule,
    MarketDataModule,
    StrategyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
