import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Huesped } from './huesped.entity';
import { HuespedesService } from './huespedes.service';
import { HuespedesController } from './huespedes.controller';
@Module({
  imports: [TypeOrmModule.forFeature([Huesped])],
  providers: [HuespedesService],
  controllers: [HuespedesController],
  exports: [HuespedesService],
})
export class HuespedesModule {}
