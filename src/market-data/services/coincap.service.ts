import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { Method } from 'axios';
import { CandleInterval, CurrencyId } from 'src/commons/constants';
import { getIntervalInMinutes } from 'src/commons/utils';
import { Config } from 'src/config/configuration';
import {
  Asset,
  CoincapResponse,
  Rate,
} from 'src/market-data/types/coincap-types';

@Injectable()
export class CoincapService {
  private readonly apiKey: string;
  private readonly baseUrl = 'https://api.coincap.io/v2';

  constructor(private readonly configService: ConfigService<Config>) {
    this.apiKey = this.configService.getOrThrow('COINCAP_API_KEY');
  }

  async getAssets() {
    return (await this.makeRequest<CoincapResponse<Asset[]>>('/assets', 'GET')).data;
  }

  async getCryptoRates() {
    const allRates = (
      await this.makeRequest<CoincapResponse<Rate[]>>('/rates', 'GET')
    ).data;
    const cryptoRates = allRates.filter((r) => r.type === 'crypto');
    return cryptoRates;
  }

  async getRecentRatesInCandles(
    assetId: CurrencyId,
    interval: CandleInterval,
    numCandles: number,
  ) {
    const intervalInMinutes = getIntervalInMinutes(interval);
    const now = Date.now();
    const end = now - (now % (60 * 1000)); // Last minute that has passed
    const start = end - numCandles * intervalInMinutes * 60 * 1000;
    const path = `/assets/${assetId}/history?interval=${interval}&start=${start}&end=${end}`;
    const response = await this.makeRequest<
      CoincapResponse<{ priceUsd: string; time: number }[]>
    >(path, 'GET');
    return response.data;
  }

  private async makeRequest<T>(path: string, method: Method, data?: unknown) {
    const headers = {
      'Accept-Encoding': 'gzip',
      Authorization: `Bearer ${this.apiKey}`,
    };
    const response = await axios.request<T>({
      url: `${this.baseUrl}${path}`,
      method,
      headers,
      data,
      maxBodyLength: Infinity,
    });
    return response.data;
  }
}
