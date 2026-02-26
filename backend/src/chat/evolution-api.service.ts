import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeoutMs = Number(process.env.EVOLUTION_API_TIMEOUT_MS || 5000);
  private readonly retryCount = Number(process.env.EVOLUTION_API_RETRY_COUNT || 2);

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = this.requireEnv('EVOLUTION_API_URL');
    this.apiKey = this.requireEnv('EVOLUTION_API_KEY');
  }

  async sendVoice(instance: string, remoteJid: string, filePath: string) {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64Audio = fileBuffer.toString('base64');

      await this.postWithRetry(
        `${this.baseUrl}/message/sendWhatsAppAudio/${instance}`,
        {
          number: remoteJid,
          audio: base64Audio,
        },
      );
    } catch (error) {
      this.logger.error(`Erro no envio de áudio: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  async sendText(instance: string, remoteJid: string, text: string) {
    try {
      await this.postWithRetry(
        `${this.baseUrl}/message/sendText/${instance}`,
        { number: remoteJid, text },
      );
    } catch (error) {
      this.logger.error(`Erro no envio de texto: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendPresence(instance: string, remoteJid: string, type: string, delay: number = 2000) {
    try {
      await this.postWithRetry(
        `${this.baseUrl}/chat/sendPresence/${instance}`,
        { number: remoteJid, presence: type, delay },
      );
    } catch {}
  }

  private async postWithRetry(url: string, data: Record<string, unknown>) {
    let lastError: unknown;
    for (let attempt = 0; attempt <= this.retryCount; attempt++) {
      try {
        await firstValueFrom(
          this.httpService.post(url, data, {
            headers: { apikey: this.apiKey },
            timeout: this.timeoutMs,
          })
        );
        return;
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
