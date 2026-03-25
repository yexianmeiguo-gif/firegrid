import { Module } from '@nestjs/common';
import { EquipmentController } from './equipment.controller';
import { EquipmentService } from './equipment.service';
import { ChromaService } from './chroma.service';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [EquipmentController],
  providers: [EquipmentService, ChromaService],
  exports: [EquipmentService, ChromaService],
})
export class EquipmentModule {}
