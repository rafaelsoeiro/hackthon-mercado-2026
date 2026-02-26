import { Controller, Post, Get, Param } from '@nestjs/common';
import { EvolutionService } from './evolution.service';

@Controller('whatsapp')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  // Endpoint para criar instância
  @Post('instance/:instance')
  async createInstance(@Param('instance') instance: string) {
    return this.evolutionService.createInstance(instance);
  }

  // Endpoint para conectar instância e gerar QR
  @Get('connect/:instance')
  async connectInstance(@Param('instance') instance: string) {
    return this.evolutionService.connectInstance(instance);
  }
}
