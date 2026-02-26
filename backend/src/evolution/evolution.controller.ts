import { Controller, Post, Get, Param } from '@nestjs/common';
import { EvolutionService } from './evolution.service';

@Controller('whatsapp')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Post('instance/:instance')
  async createInstance(@Param('instance') instance: string) {
    return this.evolutionService.createInstance(instance);
  }

  @Get('connect/:instance')
  async connectInstance(@Param('instance') instance: string) {
    return this.evolutionService.connectInstance(instance);
  }
}
