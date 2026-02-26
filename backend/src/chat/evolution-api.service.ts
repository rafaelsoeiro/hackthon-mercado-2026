import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger(EvolutionApiService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly httpService: HttpService) {
    this.baseUrl = this.requireEnv('EVOLUTION_API_URL');
    this.apiKey = this.requireEnv('EVOLUTION_API_KEY');
  }

  async sendVoice(instance: string, remoteJid: string, filePath: string) {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64Audio = fileBuffer.toString('base64');

      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/message/sendWhatsAppAudio/${instance}`,
          {
            number: remoteJid,
            audio: base64Audio,
          },
          { headers: { apikey: this.apiKey } }
        )
      );
    } catch (error) {
      this.logger.error(`Erro no envio de áudio: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  async sendText(instance: string, remoteJid: string, text: string) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/message/sendText/${instance}`,
          {
            number: remoteJid,
            text,
          },
          { headers: { apikey: this.apiKey } }
        )
      );
    } catch (error) {
      this.logger.error(`Erro no envio de texto: ${error.response?.data?.message || error.message}`);
    }
  }

  async sendPresence(instance: string, remoteJid: string, type: string, delay: number = 2000) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.baseUrl}/chat/sendPresence/${instance}`,
          { number: remoteJid, presence: type, delay },
          { headers: { apikey: this.apiKey } }
        )
      );
    } catch {
      // fail silently
    }
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required env: ${name}`);
    }
    return value;
  }
}
