import axios from 'axios';
import * as qrcode from 'qrcode-terminal';
import { Logger } from '@nestjs/common';

export class EvolutionService {
  private readonly logger = new Logger(EvolutionService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs = Number(process.env.EVOLUTION_API_TIMEOUT_MS || 5000);
  private readonly retryCount = Number(process.env.EVOLUTION_API_RETRY_COUNT || 2);

  private client = axios.create({
    baseURL: this.baseUrl,
    headers: {
      apikey: this.apiKey,
      'Content-Type': 'application/json',
    },
    timeout: this.timeoutMs,
  });

  constructor() {
    this.baseUrl = this.requireEnv('EVOLUTION_API_URL');
    this.apiKey = this.requireEnv('EVOLUTION_API_KEY');
    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        apikey: this.apiKey,
        'Content-Type': 'application/json',
      },
      timeout: this.timeoutMs,
    });
  }

  async createInstance(instanceName: string) {
    try {
      const { data } = await this.postWithRetry('/instance/create', { instanceName });
      return data;
    } catch (error) {
      if (error.response?.status === 400) {
        return { status: 'INSTANCE_EXISTS', instanceName };
      }
      throw error;
    }
  }

async connectInstance(instanceName: string, retries = 5, delayMs = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const { data } = await this.getWithRetry(`/instance/connect/${instanceName}`);
      if (data?.qrcode) this.printQrCode(data.qrcode);
      return data;
    } catch (error: any) {
      if (error.response?.status === 404) {
        if (i < retries - 1) {
          await new Promise(res => setTimeout(res, delayMs));
          continue;
        }
        return {
          status: 'INSTANCE_NOT_FOUND',
          instanceName,
          message: error.response.data?.response?.message || 'Instance não encontrada',
        };
      }
      throw error;
    }
  }
}


  private printQrCode(qrText: string) {
    this.logger.log('QR Code para conectar WhatsApp');
    qrcode.generate(qrText, { small: true });
    this.logger.log('Escaneie com o WhatsApp para conectar');
  }

  private async postWithRetry(path: string, data: Record<string, unknown>) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        return await this.client.post(path, data);
      } catch (error) {
        lastError = error;
        if (attempt < this.retryCount) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError;
  }

  private async getWithRetry(path: string) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        return await this.client.get(path);
      } catch (error) {
        lastError = error;
        if (attempt < this.retryCount) {
          await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
          continue;
        }
      }
    }
    throw lastError;
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required env: ${name}`);
    }
    return value;
  }
}
