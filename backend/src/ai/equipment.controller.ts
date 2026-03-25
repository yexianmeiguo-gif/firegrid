import { Controller, Post, Get, Body, Param } from '@nestjs/common';
import { EquipmentService } from './equipment.service';

@Controller('ai/equipment')
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post('search')
  search(@Body() body: { query: string; limit?: number }) {
    return this.equipmentService.searchByNaturalLanguage(body.query, body.limit);
  }

  @Post('recommend')
  recommend(@Body() body: any) {
    return this.equipmentService.recommendByForm(body);
  }

  @Get(':id')
  getDetails(@Param('id') id: string) {
    return this.equipmentService.getEquipmentDetails(id);
  }
}
