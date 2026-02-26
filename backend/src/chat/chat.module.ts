import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { OpenAIService } from './openai.service';
import { AudioService } from './audio.service';
import { EvolutionApiService } from './evolution-api.service';

@Module({
  imports: [HttpModule], 
  controllers: [ChatController],
  providers: [
    ChatService, 
    OpenAIService, 
    AudioService,
    EvolutionApiService,
  ],
})
export class ChatModule {}
