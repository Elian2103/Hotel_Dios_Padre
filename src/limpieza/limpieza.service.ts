import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { AsignacionLimpieza } from '../asignaciones-limpieza/entities/asignacion-limpieza.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
import { Observacion } from '../observaciones/observacion.entity';
@Injectable()
export class LimpiezaService {
  constructor(
    @InjectRepository(AsignacionLimpieza)
    private a: Repository<AsignacionLimpieza>,
    @InjectRepository(Habitacion) private h: Repository<Habitacion>,
    @InjectRepository(EstadoHabitacion) private e: Repository<EstadoHabitacion>,
    @InjectRepository(Observacion) private o: Repository<Observacion>,
    private ds: DataSource,
  ) {}
  list() {
    return this.ds.query(
      `SELECT a.*,h.numero,u.nombre camarista
       FROM asignaciones_limpieza a
       JOIN habitaciones h ON h.id=a.habitacion_id
       JOIN usuarios u ON u.id=a.camarista_id
       WHERE a.estado <> 'Finalizada'
          OR (a.fecha = CURDATE() AND CURTIME() < '23:59:00')
       ORDER BY a.fecha DESC,a.id DESC`,
    );
  }
  async asignar(d: any) {
    const hoy = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'America/Mexico_City',
      year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(new Date());
    if (d.fecha && d.fecha < hoy) {
      throw new BadRequestException(
        'La fecha de asignación no puede ser anterior a la fecha actual',
      );
    }
    let x = await this.a.findOneBy({
      habitacionId: d.habitacionId,
      fecha: d.fecha,
    });
    if (x) {
      x.camaristaId = d.camaristaId;
      x.estado = 'Pendiente';
    } else
      x = this.a.create({
        habitacionId: d.habitacionId,
        camaristaId: d.camaristaId,
        fecha: d.fecha,
        estado: 'Pendiente',
      });
    await this.a.save(x);
    const e = await this.e.findOneBy({ nombre: 'Sucia' });
    if (e) await this.h.update(d.habitacionId, { estadoId: e.id });
    return x;
  }
  async cambiar(id: number, estado: string, userId: number, obs?: string) {
    const a = await this.a.findOneBy({ id });
    if (!a) throw new NotFoundException();
    a.estado =
      estado === 'Limpia'
        ? 'Finalizada'
        : estado === 'En proceso'
          ? 'En proceso'
          : 'Pendiente';
    await this.a.save(a);
    const estadoHabitacion = estado === 'Limpia' ? 'Disponible' : estado;
    const e = await this.e.findOneBy({ nombre: estadoHabitacion });
    if (e) await this.h.update(a.habitacionId, { estadoId: e.id });
    if (obs)
      await this.o.save(
        this.o.create({
          habitacionId: a.habitacionId,
          usuarioId: userId,
          tipo: 'Camarista',
          descripcion: obs,
        }),
      );
    return a;
  }
  observaciones() {
    return this.ds.query(
      `SELECT o.*,h.numero,u.nombre usuario
       FROM observaciones o
       JOIN habitaciones h ON h.id=o.habitacion_id
       JOIN usuarios u ON u.id=o.usuario_id
       WHERE DATE(o.created_at) = CURDATE()
         AND CURTIME() < '23:59:00'
       ORDER BY o.id DESC`,
    );
  }
}
