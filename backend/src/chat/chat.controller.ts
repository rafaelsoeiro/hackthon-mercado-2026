import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post('evolution')
  async handleWebhook(@Body() payload: any) {
    // 1. Validação básica do evento
    if (payload.event !== 'messages.upsert') {
      return { status: 'ignored' };
    }

    const { instance, data, sender } = payload;
    const key = data?.key;
    const message = data?.message;

    // // 2. Ignora mensagens enviadas pelo próprio bot (fromMe)
    // if (!key || key.fromMe) {
    //   return { status: 'ignored_from_me' };
    // }

    const remoteJid = key.remoteJid;
    const isGroup = remoteJid.includes('@g.us'); // Opcional: ignorar grupos se quiser

    // 3. Extração de conteúdo
    const text =
      message?.conversation ||
      message?.extendedTextMessage?.text ||
      null;

    const messageType = data.messageType;
    const isAudio = messageType === 'audioMessage' || messageType === 'voiceMessage';
    
    // 4. Pega o Base64 DIRETO do payload (Correção do erro 404/400)
    const audioBase64 = isAudio ? message?.base64 : null;

    if (!text && !audioBase64) {
      return { status: 'ignored_no_content' };
    }

    this.logger.log(`📩 Mensagem recebida de ${remoteJid} [${isAudio ? 'AUDIO' : 'TEXTO'}]`);

    // 5. Delega para o Service
    await this.chatService.processMessage({
      instance: instance || 'devTeste',
      remoteJid,
      text,
      audioBase64,
      pushName: data.pushName,
    });

    return { status: 'ok' };
  }
}