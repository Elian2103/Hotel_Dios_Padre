import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Huesped } from '../huespedes/huesped.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { ReservacionHabitacion } from './entities/reservacion-habitacion.entity';
import { Reservacion } from './entities/reservacion.entity';
import { ReservacionesController } from './reservaciones.controller';
import { ReservacionesService } from './reservaciones.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Reservacion,
      ReservacionHabitacion,
      Habitacion,
      EstadoHabitacion,
      Huesped,
    ]),
  ],
  providers: [ReservacionesService],
  controllers: [ReservacionesController],
})
export class ReservacionesModule {}
