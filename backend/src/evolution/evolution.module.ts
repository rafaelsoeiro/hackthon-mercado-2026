import { Module } from '@nestjs/common';
import { EvolutionService } from './evolution.service';
import { EvolutionController } from './evolution.controller';

@Module({
  controllers: [EvolutionController],
  providers: [EvolutionService],
})
export class EvolutionModule {}
