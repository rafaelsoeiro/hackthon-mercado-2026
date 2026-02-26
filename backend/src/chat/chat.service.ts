import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as fs from 'fs';
import { OpenAIService } from './OpenAI.service';
import { AudioService } from './audio.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  private readonly evolutionApiUrl: string;
  private readonly evolutionApiKey: string;

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly audioService: AudioService,
    private readonly httpService: HttpService,
  ) {
    this.evolutionApiUrl = this.requireEnv('EVOLUTION_API_URL');
    this.evolutionApiKey = this.requireEnv('EVOLUTION_API_KEY');
  }

  // Handler legado
  async handleIncomingMessage(instance: string, remoteNumber: string, text: string | null, messageId: string | null) {
    return this.processMessage({
      instance,
      remoteJid: `${remoteNumber}@s.whatsapp.net`,
      text,
      audioBase64: null,
      pushName: '',
    });
  }

  async processMessage(data: {
    instance: string;
    remoteJid: string;
    text: string | null;
    audioBase64: string | null;
    pushName: string;
  }) {
    let finalInputText = data.text;
    const isVoiceInput = !!data.audioBase64; // Flag: É mensagem de voz?

    // 1. Feedback inicial
    this.sendPresence(data.instance, data.remoteJid, isVoiceInput ? 'recording' : 'composing');

    // 2. Transcrição (se veio áudio)
    if (isVoiceInput) {
      let tempFilePath: string | null = null;
      try {
        // Salva arquivo localmente a partir do base64
        tempFilePath = await this.audioService.saveBase64ToOgg(data.audioBase64!);
        
        // Transcreve usando Whisper
        finalInputText = await this.openAIService.transcribeAudio(tempFilePath);
        
        this.logger.log(`🎙️ Transcrição: "${finalInputText}"`);
      } catch (e) {
        this.logger.error('❌ Falha na transcrição', e);
        return;
      } finally {
        if (tempFilePath) await this.audioService.deleteFile(tempFilePath);
      }
    }

    if (!finalInputText) return;

    // 3. Inteligência Artificial
    this.logger.log(`🤖 Processando entrada: "${finalInputText}"`);
    const aiResponse = await this.openAIService.generateReply(data.remoteJid, finalInputText);
    this.logger.log(`🧠 Resposta Gerada: "${aiResponse}"`);

    // 4. Decisão de Formato de Resposta (Texto vs Áudio)
    if (isVoiceInput) {
        // === FLUXO DE ÁUDIO (Usuário mandou áudio -> Recebe áudio) ===
        try {
            // Mantém status "gravando..."
            await this.sendPresence(data.instance, data.remoteJid, 'recording', 3000);

            // Gera o áudio da resposta (TTS)
            const audioResponsePath = await this.openAIService.textToSpeech(aiResponse);
            
            this.logger.log(`📤 Enviando resposta em Áudio...`);
            await this.sendVoiceToEvolution(data.instance, data.remoteJid, audioResponsePath);

            // Limpeza
            await this.audioService.deleteFile(audioResponsePath);

        } catch (error) {
            this.logger.error('Falha no envio de áudio, enviando texto como fallback');
            await this.sendTextToEvolution(data.instance, data.remoteJid, aiResponse);
        }

    } else {
        // === FLUXO DE TEXTO (Usuário mandou texto -> Recebe texto) ===
        this.logger.log(`📤 Enviando resposta em Texto...`);
        
        // Simula digitação baseada no tamanho do texto
        const delay = Math.min(aiResponse.length * 30, 3000);
        await this.sendPresence(data.instance, data.remoteJid, 'composing', delay);
        await new Promise(r => setTimeout(r, delay));

        await this.sendTextToEvolution(data.instance, data.remoteJid, aiResponse);
    }
  }

  // --- Helpers de Envio ---

  private async sendVoiceToEvolution(instance: string, remoteJid: string, filePath: string) {
    try {
      const fileBuffer = await fs.promises.readFile(filePath);
      const base64Audio = fileBuffer.toString('base64');

      await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/message/sendWhatsAppAudio/${instance}`,
          {
            number: remoteJid,
            audio: base64Audio,
          },
          { headers: { apikey: this.evolutionApiKey } }
        )
      );
    } catch (error) {
      this.logger.error(`❌ Erro no envio de áudio: ${error.response?.data?.message || error.message}`);
      throw error;
    }
  }

  private async sendTextToEvolution(instance: string, remoteJid: string, text: string) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/message/sendText/${instance}`,
          {
            number: remoteJid,
            text: text,
          },
          { headers: { apikey: this.evolutionApiKey } }
        )
      );
    } catch (error) {
      this.logger.error(`❌ Erro no envio de texto: ${error.response?.data?.message || error.message}`);
    }
  }

  private async sendPresence(instance: string, remoteJid: string, type: string, delay: number = 2000) {
    try {
      await firstValueFrom(
        this.httpService.post(
          `${this.evolutionApiUrl}/chat/sendPresence/${instance}`,
          { number: remoteJid, presence: type, delay },
          { headers: { apikey: this.evolutionApiKey } }
        )
      );
    } catch (e) { /* Fail silently */ }
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required env: ${name}`);
    }
    return value;
  }
}
