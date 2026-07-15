import {
  Body,
  Controller,
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
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { LimpiezaService } from './limpieza.service';
@Controller('limpieza')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LimpiezaController {
  constructor(private s: LimpiezaService) {}
  @Get() @Roles('Administrador') list() {
    return this.s.list();
  }
  @Get('observaciones') @Roles('Administrador') obs() {
    return this.s.observaciones();
  }
  @Post('asignar') @Roles('Administrador') asig(@Body() d: any) {
    return this.s.asignar(d);
  }
  @Patch(':id/estado') @Roles('Camarista', 'Administrador') estado(
    @Param('id', ParseIntPipe) id: number,
    @Body() d: any,
    @UsuarioActual() u: any,
  ) {
    return this.s.cambiar(id, d.estado, u.id, d.observacion);
  }
}
