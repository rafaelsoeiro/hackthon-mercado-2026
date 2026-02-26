import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class AudioService {
  private readonly logger = new Logger(AudioService.name);
  private readonly tempDir = path.join(__dirname, '../../tmp');

  constructor() {
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  async saveBase64ToOgg(base64Data: string): Promise<string> {
    try {
      const cleanBase64 = base64Data.replace(/^data:.*;base64,/, '');
      
      const fileName = `audio-${Date.now()}.ogg`;
      const filePath = path.join(this.tempDir, fileName);

      const buffer = Buffer.from(cleanBase64, 'base64');
      await fs.promises.writeFile(filePath, buffer);

      return filePath;
    } catch (error) {
      this.logger.error('Erro ao salvar audio base64', error);
      throw error;
    }
  }

  async deleteFile(filePath: string) {
    try {
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
    } catch (e) {
      this.logger.warn(`Não foi possível deletar arquivo temp: ${filePath}`);
    }
  }
}
