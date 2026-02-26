import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';

@Injectable()
export class SpeechToTextService {
  private openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  async transcribe(filePath: string): Promise<string> {
    const transcription = await this.openai.audio.transcriptions.create({
      file: fs.createReadStream(filePath),
      model: 'gpt-4o-transcribe',
      language: 'pt-BR',
    });

    return transcription.text;
  }
}
