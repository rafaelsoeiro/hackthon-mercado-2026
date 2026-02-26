import { PartialType } from '@nestjs/mapped-types';
import { CreateEvolutionDto } from './create-evolution.dto';

export class UpdateEvolutionDto extends PartialType(CreateEvolutionDto) {}
