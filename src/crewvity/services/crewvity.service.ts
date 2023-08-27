import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import {
  CurrencyId,
  PositionDirection,
  PositionSize,
} from 'src/commons/constants';
import { Config } from 'src/config/configuration';
import { PositionDto } from 'src/crewvity/dto';

@Injectable()
export class CrewvityService {
  private readonly logger = new Logger(CrewvityService.name);

  private readonly apiKey: string;
  private readonly baseUrl: string;

  constructor(private readonly configService: ConfigService<Config>) {
    this.apiKey = this.configService.getOrThrow('CREWVITY_API_KEY');
    this.baseUrl = this.configService.getOrThrow('CREWVITY_API_BASE_URL');
  }

  async getAssets() {
    const path = '/assets/get';
    return await this.makeRequest(path);
  }

  async getPosition(positionId: string) {
    const path = '/strategies/positions/get-position';
    const payload = {
      positionId,
    };
    return await this.makeRequest<PositionDto>(path, payload);
  }

  async getAllOpenPositions(strategyId?: string) {
    const path = '/strategies/positions/get-all-open-positions';
    const payload = strategyId
      ? {
          strategyId,
        }
      : undefined;
    return await this.makeRequest<PositionDto[]>(path, payload);
  }

  async openPosition(
    strategyId: string,
    direction: PositionDirection,
    assetId: CurrencyId,
    size: PositionSize,
  ) {
    const path = '/strategies/positions/open';
    const payload = {
      strategyId,
      direction,
      assetId,
      size,
    };
    return await this.makeRequest<PositionDto>(path, payload);
  }

  async closePosition(positionId: string) {
    const path = '/strategies/positions/close';
    const payload = {
      positionId,
    };
    return await this.makeRequest<PositionDto>(path, payload);
  }

  async closePositionPartial(positionId: string, size: PositionSize) {
    const path = '/strategies/positions/partial-close';
    const payload = {
      positionId,
      size,
    };
    return await this.makeRequest<PositionDto>(path, payload);
  }

  async closeAllPositions() {
    const positions = await this.getAllOpenPositions();
    this.logger.log(`Found ${positions.length} open positions`);

    for (const position of positions) {
      await this.closePosition(position.id);
    }
    this.logger.log(`Closed all open positions`);
  }

  private async makeRequest<T>(path: string, data?: unknown) {
    const headers = {
      'x-api-key': this.apiKey,
    };

    try {
      const response = await axios.request<T>({
        url: `${this.baseUrl}${path}`,
        method: 'POST',
        headers,
        data,
        maxBodyLength: Infinity,
      });
      return response.data;
    } catch (error) {
      this.logger.error(
        `Failed to make request to Crewvity API: ${JSON.stringify(
          {
            path,
            data,
          },
          null,
          2,
        )}`,
        error,
      );
      throw error;
    }
  }
}
