import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Tarifa } from './entities/tarifa.entity';
import { TarifasService } from './tarifas.service';
import { TarifasController } from './tarifas.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Tarifa])],
  providers: [TarifasService],
  controllers: [TarifasController],
  exports: [TarifasService],
})
export class TarifasModule {}
