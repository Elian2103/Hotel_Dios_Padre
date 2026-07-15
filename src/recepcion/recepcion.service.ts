import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Checkin } from './entities/checkin.entity';
import { Checkout } from './entities/checkout.entity';
import { Reservacion } from '../reservaciones/entities/reservacion.entity';
import { ReservacionHabitacion } from '../reservaciones/entities/reservacion-habitacion.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
@Injectable()
export class RecepcionService {
  constructor(
    @InjectRepository(Checkin) private ci: Repository<Checkin>,
    @InjectRepository(Checkout) private co: Repository<Checkout>,
    @InjectRepository(Reservacion) private r: Repository<Reservacion>,
    @InjectRepository(ReservacionHabitacion)
    private rh: Repository<ReservacionHabitacion>,
    @InjectRepository(Habitacion) private h: Repository<Habitacion>,
    @InjectRepository(EstadoHabitacion) private e: Repository<EstadoHabitacion>,
    private ds: DataSource,
  ) {}
  historial() {
    return this.ds.query(
      "SELECT 'Check-in' tipo,c.fecha,c.reservacion_id,c.observaciones FROM checkin c UNION ALL SELECT 'Check-out',o.fecha,o.reservacion_id,o.observaciones FROM checkout o ORDER BY fecha DESC",
    );
  }
  async cambio(reservacionId: number, nuevaHabitacionId: number) {
    const link = await this.rh.findOneBy({ reservacionId });
    if (!link) throw new NotFoundException();
    const anterior = link.habitacionId;
    link.habitacionId = nuevaHabitacionId;
    await this.rh.save(link);
    const disponible = await this.e.findOneBy({ nombre: 'Disponible' }),
      ocupada = await this.e.findOneBy({ nombre: 'Ocupada' });
    if (disponible) await this.h.update(anterior, { estadoId: disponible.id });
    if (ocupada)
      await this.h.update(nuevaHabitacionId, { estadoId: ocupada.id });
    return link;
  }
  async checkin(d: any, userId: number) {
    return this.ds.transaction(async (m) => {
      const r = await m.findOne(Reservacion, {
        where: { id: d.reservacionId },
      });
      if (!r) throw new NotFoundException('Reservación no encontrada');
      await m.save(
        Checkin,
        m.create(Checkin, {
          reservacionId: r.id,
          fecha: new Date(),
          usuarioId: userId,
          observaciones: d.observaciones,
        }),
      );
      const est = await m.findOne(EstadoHabitacion, {
        where: { nombre: 'Ocupada' },
      });
      const links = await m.find(ReservacionHabitacion, {
        where: { reservacionId: r.id },
      });
      if (est)
        await m.update(
          Habitacion,
          links.map((x) => x.habitacionId),
          { estadoId: est.id },
        );
      return { message: 'Check-in realizado' };
    });
  }
  async checkout(d: any, userId: number) {
    return this.ds.transaction(async (m) => {
      const r = await m.findOne(Reservacion, {
        where: { id: d.reservacionId },
      });
      if (!r) throw new NotFoundException();
      await m.save(
        Checkout,
        m.create(Checkout, {
          reservacionId: r.id,
          fecha: new Date(),
          usuarioId: userId,
          observaciones: d.observaciones,
        }),
      );
      r.estado = 'Finalizada';
      await m.save(r);
      const est = await m.findOne(EstadoHabitacion, {
        where: { nombre: 'Pendiente de limpieza' },
      });
      const links = await m.find(ReservacionHabitacion, {
        where: { reservacionId: r.id },
      });
      if (est)
        await m.update(
          Habitacion,
          links.map((x) => x.habitacionId),
          { estadoId: est.id },
        );
      return { message: 'Check-out realizado' };
    });
  }
}
