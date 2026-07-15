import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { HuespedesService } from './huespedes.service';
@Controller('huespedes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
export class HuespedesController {
  constructor(private s: HuespedesService) {}
  @Get() all() {
    return this.s.findAll();
  }
  @Get(':id') one(@Param('id', ParseIntPipe) id: number) {
    return this.s.findOne(id);
  }
  @Post() create(@Body() d: any) {
    return this.s.create(d);
  }
  @Patch(':id') update(@Param('id', ParseIntPipe) id: number, @Body() d: any) {
    return this.s.update(id, d);
  }
  @Delete(':id') remove(@Param('id', ParseIntPipe) id: number) {
    return this.s.remove(id);
  }
}
