import { Controller, Post, Get, Param, HttpException, HttpStatus } from '@nestjs/common';
import { EvolutionService } from './evolution.service';

@Controller('whatsapp')
export class EvolutionController {
  constructor(private readonly evolutionService: EvolutionService) {}

  @Post('instance/:instance')
  async createInstance(@Param('instance') instance: string) {
    try {
      const data = await this.evolutionService.createInstance(instance);
      return { status: 'ok', data, error: null };
    } catch (error) {
      throw new HttpException(
        { status: 'error', data: null, error: 'create_instance_failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('connect/:instance')
  async connectInstance(@Param('instance') instance: string) {
    try {
      const data = await this.evolutionService.connectInstance(instance);
      return { status: 'ok', data, error: null };
    } catch (error) {
      throw new HttpException(
        { status: 'error', data: null, error: 'connect_instance_failed' },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
