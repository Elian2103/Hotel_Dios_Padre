import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';
import { RecepcionService } from './recepcion.service';
@Controller('recepcion')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
export class RecepcionController {
  constructor(private s: RecepcionService) {}
  @Get('historial') h() {
    return this.s.historial();
  }
  @Post('checkin') ci(@Body() d: any, @UsuarioActual() u: any) {
    return this.s.checkin(d, u.id);
  }
  @Post('checkout') co(@Body() d: any, @UsuarioActual() u: any) {
    return this.s.checkout(d, u.id);
  }
  @Post('cambiar-habitacion') c(@Body() d: any) {
    return this.s.cambio(d.reservacionId, d.nuevaHabitacionId);
  }
}
