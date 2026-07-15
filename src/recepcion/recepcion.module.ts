import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Checkin } from './entities/checkin.entity';
import { Checkout } from './entities/checkout.entity';
import { Reservacion } from '../reservaciones/entities/reservacion.entity';
import { ReservacionHabitacion } from '../reservaciones/entities/reservacion-habitacion.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
import { RecepcionService } from './recepcion.service';
import { RecepcionController } from './recepcion.controller';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Checkin,
      Checkout,
      Reservacion,
      ReservacionHabitacion,
      Habitacion,
      EstadoHabitacion,
    ]),
  ],
  providers: [RecepcionService],
  controllers: [RecepcionController],
})
export class RecepcionModule {}
