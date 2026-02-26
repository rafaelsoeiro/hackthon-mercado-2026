import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIService } from './OpenAI.service'; // Atenção ao case (OpenAI.service vs openai.service)
import { AudioService } from './audio.service';   // <-- O erro diz que isso falta ou não está sendo injetado
import { EvolutionApiService } from './evolution-api.service';

@Module({
  imports: [HttpModule], 
  controllers: [ChatController],
  providers: [
    ChatService, 
    OpenAIService, 
    AudioService, // <--- ESSENCIAL: O AudioService deve estar aqui
    EvolutionApiService,
  ],
})
export class ChatModule {}
