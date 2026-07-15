import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AsignacionLimpieza } from '../asignaciones-limpieza/entities/asignacion-limpieza.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
import { Observacion } from '../observaciones/observacion.entity';
import { LimpiezaService } from './limpieza.service';
import { LimpiezaController } from './limpieza.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      AsignacionLimpieza,
      Habitacion,
      EstadoHabitacion,
      Observacion,
    ]),
  ],
  providers: [LimpiezaService],
  controllers: [LimpiezaController],
})
export class LimpiezaModule {}
