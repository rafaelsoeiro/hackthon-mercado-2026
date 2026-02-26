import { Injectable, Logger } from '@nestjs/common';
import { OpenAIService } from './OpenAI.service';
import { AudioService } from './audio.service';
import { EvolutionApiService } from './evolution-api.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly openAIService: OpenAIService,
    private readonly audioService: AudioService,
    private readonly evolutionApi: EvolutionApiService,
  ) {}

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
    this.evolutionApi.sendPresence(data.instance, data.remoteJid, isVoiceInput ? 'recording' : 'composing');

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
            await this.evolutionApi.sendPresence(data.instance, data.remoteJid, 'recording', 3000);

            // Gera o áudio da resposta (TTS)
            const audioResponsePath = await this.openAIService.textToSpeech(aiResponse);
            
            this.logger.log(`📤 Enviando resposta em Áudio...`);
            await this.evolutionApi.sendVoice(data.instance, data.remoteJid, audioResponsePath);

            // Limpeza
            await this.audioService.deleteFile(audioResponsePath);

        } catch (error) {
            this.logger.error('Falha no envio de áudio, enviando texto como fallback');
            await this.evolutionApi.sendText(data.instance, data.remoteJid, aiResponse);
        }

    } else {
        // === FLUXO DE TEXTO (Usuário mandou texto -> Recebe texto) ===
        this.logger.log(`📤 Enviando resposta em Texto...`);
        
        // Simula digitação baseada no tamanho do texto
        const delay = Math.min(aiResponse.length * 30, 3000);
        await this.evolutionApi.sendPresence(data.instance, data.remoteJid, 'composing', delay);
        await new Promise(r => setTimeout(r, delay));

        await this.evolutionApi.sendText(data.instance, data.remoteJid, aiResponse);
    }
  }
}
