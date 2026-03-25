import { Module } from '@nestjs/common';
import { AIService } from './ai.service';
import { AIController } from './ai.controller';
import { TestChromaController } from './test-chroma.controller';
import { EquipmentModule } from './equipment.module';

@Module({
  imports: [EquipmentModule],
  providers: [AIService],
  controllers: [AIController, TestChromaController],
})
export class AIModule {}