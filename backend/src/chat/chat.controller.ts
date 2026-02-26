import { Controller, Post, Body, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('evolution')
  async handleWebhook(@Body() payload: any) {
    if (payload.event !== 'messages.upsert') {
      return { status: 'ignored', data: null, error: null };
    }

    const { instance, data, sender } = payload;
    const key = data?.key;
    const message = data?.message;

    const remoteJid = key.remoteJid;
    const isGroup = remoteJid.includes('@g.us');

    const text =
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      null;

    const messageType = data.messageType;
    const isAudio = messageType === 'audioMessage' || messageType === 'voiceMessage';
    
    const audioBase64 = isAudio ? message?.base64 : null;

    if (!text && !audioBase64) {
      return { status: 'ignored', data: null, error: 'no_content' };
    }

    this.logger.log(`Mensagem recebida de ${remoteJid} [${isAudio ? 'AUDIO' : 'TEXTO'}]`);

    try {
      await this.chatService.processMessage({
        instance: instance || 'devTeste',
        remoteJid,
        text,
        audioBase64,
        pushName: data.pushName,
      });
      return { status: 'ok', data: { accepted: true }, error: null };
    } catch (error) {
      this.logger.error('Erro ao processar mensagem', error);
      throw new HttpException(
        { status: 'error', data: null, error: 'processing_failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
