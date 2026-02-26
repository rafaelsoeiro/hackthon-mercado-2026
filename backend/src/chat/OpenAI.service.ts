import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class OpenAIService {
  private readonly logger = new Logger(OpenAIService.name);
  private readonly client: OpenAI;

  private readonly assistantId: string;
  private readonly apiKey: string;

  private readonly dbPath = path.join(__dirname, '../../tmp/threads_db.json');

  constructor() {
    this.apiKey = this.requireEnv('OPENAI_API_KEY');
    this.assistantId = this.requireEnv('OPENAI_ASSISTANT_ID');
    this.client = new OpenAI({
      apiKey: this.apiKey,
      timeout: 30000,
    });
    this.initDb();
  }

  async transcribeAudio(filePath: string): Promise<string> {
    try {
      const transcription = await this.client.audio.transcriptions.create({
        file: fs.createReadStream(filePath),
        model: 'whisper-1',
        language: 'pt',
      });
      return transcription.text;
    } catch (error) {
      this.logger.error('Erro na transcrição', error);
      throw new Error('Falha ao transcrever áudio.');
    }
  }

  async textToSpeech(text: string): Promise<string> {
    try {
      const mp3 = await this.client.audio.speech.create({
        model: "tts-1",
        voice: "alloy",
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      const tempDir = path.join(__dirname, '../../tmp');
      if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

      const fileName = `tts-${Date.now()}.mp3`;
      const filePath = path.join(tempDir, fileName);
      
      await fs.promises.writeFile(filePath, buffer);
      return filePath;
    } catch (error) {
      this.logger.error('Erro ao gerar áudio (TTS)', error);
      throw error;
    }
  }

  async generateReply(userId: string, userMessage: string): Promise<string> {
    try {
      const threadId = await this.getOrCreateThread(userId);
      this.logger.log(`Thread ID para ${userId}: ${threadId}`);

      // --- CORREÇÃO APLICADA AQUI ---
      const activeRuns = await this.client.beta.threads.runs.list(threadId);
      const activeRun = activeRuns.data.find(r => 
        ['queued', 'in_progress', 'requires_action'].includes(r.status)
      );

      if (activeRun) {
        this.logger.warn(`Cancelando run anterior (${activeRun.id})`);
        // Forçamos o tipo para evitar o erro TS2345
        await this.client.beta.threads.runs.cancel(threadId, activeRun.id as any);
        await new Promise(r => setTimeout(r, 1000));
      }
      // -----------------------------

      await this.client.beta.threads.messages.create(threadId, {
        role: 'user',
        content: userMessage,
      });

      const run = await this.client.beta.threads.runs.create(threadId, {
        assistant_id: this.assistantId,
      });

      let status = run.status;
      while (status !== 'completed') {
        await new Promise((resolve) => setTimeout(resolve, 800));
        const updatedRun = await this.client.beta.threads.runs.retrieve(run.id, {
          thread_id: threadId,
        });
        status = updatedRun.status;

        if (['failed', 'cancelled', 'expired'].includes(status)) {
          this.logger.error(`Run falhou: ${status}`);
          return 'Tive um problema técnico. Pode repetir?';
        }
      }

      const messages = await this.client.beta.threads.messages.list(threadId);
      const lastMessage = messages.data.find((m) => m.role === 'assistant');

      if (lastMessage?.content[0]?.type === 'text') {
        return lastMessage.content[0].text.value;
      }

      return '';
    } catch (error) {
      this.logger.error('Erro no Assistant', error);
      return 'Estou indisponível no momento.';
    }
  }

  private async getOrCreateThread(userId: string): Promise<string> {
    const db = this.loadDb();
    if (db[userId]) return db[userId];

    const thread = await this.client.beta.threads.create();
    db[userId] = thread.id;
    this.saveDb(db);
    return thread.id;
  }

  private initDb() {
    const dir = path.dirname(this.dbPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.dbPath)) fs.writeFileSync(this.dbPath, '{}');
  }

  private loadDb(): Record<string, string> {
    try { return JSON.parse(fs.readFileSync(this.dbPath, 'utf-8')); } catch { return {}; }
  }

  private saveDb(data: Record<string, string>) {
    fs.writeFileSync(this.dbPath, JSON.stringify(data, null, 2));
  }

  private requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) {
      throw new Error(`Missing required env: ${name}`);
    }
    return value;
  }
}
