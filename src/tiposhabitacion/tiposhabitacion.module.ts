import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TipoHabitacion } from './entities/tipo-habitacion.entity';
import { TiposHabitacionService } from './tiposhabitacion.service';
import { TiposHabitacionController } from './tiposhabitacion.controller';
@Module({
  imports: [TypeOrmModule.forFeature([TipoHabitacion])],
  providers: [TiposHabitacionService],
  controllers: [TiposHabitacionController],
  exports: [TiposHabitacionService],
})
export class TiposHabitacionModule {}
