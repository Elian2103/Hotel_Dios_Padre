import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Reservacion } from './entities/reservacion.entity';
import { ReservacionHabitacion } from './entities/reservacion-habitacion.entity';
import { Habitacion } from '../habitaciones/entities/habitacion.entity';
import { EstadoHabitacion } from '../habitaciones/entities/estado-habitacion.entity';
import { Huesped } from '../huespedes/huesped.entity';

@Injectable()
export class ReservacionesService {
  constructor(
    @InjectRepository(Reservacion)
    private readonly reservaciones: Repository<Reservacion>,
    @InjectRepository(ReservacionHabitacion)
    private readonly enlaces: Repository<ReservacionHabitacion>,
    @InjectRepository(Habitacion)
    private readonly habitaciones: Repository<Habitacion>,
    @InjectRepository(EstadoHabitacion)
    private readonly estados: Repository<EstadoHabitacion>,
    private readonly dataSource: DataSource,
  ) {}

  list(estado?: string) {
    const consulta = this.reservaciones
      .createQueryBuilder('r')
      .leftJoin('huespedes', 'h', 'h.id=r.huesped_id')
      .leftJoin('usuarios', 'u', 'u.id=r.usuario_id')
      .leftJoin('reservacion_habitaciones', 'rh', 'rh.reservacion_id=r.id')
      .leftJoin('habitaciones', 'ha', 'ha.id=rh.habitacion_id')
      .select([
        'r.*',
        'h.nombre AS huesped_nombre',
        'h.apellido_paterno AS huesped_apellido',
        'u.nombre AS recepcionista_nombre',
        "GROUP_CONCAT(CONCAT(ha.numero, IF(ha.foto_url IS NULL, '', CONCAT('|',ha.foto_url)))) AS habitaciones_detalle",
      ])
      .groupBy('r.id')
      .orderBy('r.id', 'DESC');

    if (estado) consulta.andWhere('r.estado = :estado', { estado });
    return consulta.getRawMany();
  }

  async disponibles(inicio: string, fin: string) {
    if (!inicio || !fin) {
      throw new BadRequestException('Selecciona fecha de entrada y salida');
    }
    if (new Date(fin) <= new Date(inicio)) {
      throw new BadRequestException(
        'La salida debe ser posterior a la entrada',
      );
    }

    return this.habitaciones
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.estado', 'estado')
      .leftJoinAndSelect('h.tipo', 'tipo')
      .where('h.activa=1')
      .andWhere(
        `h.id NOT IN (
          SELECT rh.habitacion_id
          FROM reservacion_habitaciones rh
          JOIN reservaciones r ON r.id=rh.reservacion_id
          WHERE r.estado IN ('En proceso','Confirmada')
          AND r.fecha_inicio < :fin
          AND r.fecha_fin > :inicio
        )`,
        { inicio, fin },
      )
      .andWhere(
        "estado.nombre NOT IN ('Fuera de servicio','Ocupada','Pendiente de limpieza','Sucia','En proceso')",
      )
      .orderBy('h.numero', 'ASC')
      .getMany();
  }

  async create(data: any, usuarioId: number) {
    this.validarDatos(data);
    const habitacionIds = (data.habitacionIds ?? []).map(Number);
    if (!habitacionIds.length) {
      throw new BadRequestException('Selecciona al menos una habitación');
    }

    const disponibles = await this.disponibles(data.fechaInicio, data.fechaFin);
    const permitidas = new Set(disponibles.map((habitacion) => habitacion.id));
    const bloqueadas = await this.habitaciones.find({
      where: { id: In(habitacionIds) },
      relations: { estado: true },
    });
    bloqueadas
      .filter(
        (habitacion) =>
          habitacion.estado?.nombre === 'En proceso de reservación',
      )
      .forEach((habitacion) => permitidas.add(habitacion.id));
    if (habitacionIds.some((id: number) => !permitidas.has(id))) {
      throw new BadRequestException(
        'Una de las habitaciones seleccionadas ya no está disponible',
      );
    }

    return this.dataSource.transaction(async (manager) => {
      let huespedId = Number(data.huespedId);
      if (!huespedId && data.huesped) {
        const huesped = await manager.save(
          Huesped,
          manager.create(Huesped, this.normalizarHuesped(data.huesped)),
        );
        huespedId = huesped.id;
      }
      if (!huespedId) {
        throw new BadRequestException('Captura los datos del huésped');
      }

      const reservacion = await manager.save(
        Reservacion,
        manager.create(Reservacion, {
          folio: `RES-${Date.now()}`,
          huespedId,
          usuarioId,
          fechaInicio: data.fechaInicio,
          fechaFin: data.fechaFin,
          adultos: Number(data.adultos || 1),
          menores: Number(data.menores || 0),
          // Las reservaciones se registran con el cliente presente en recepción.
          estado: 'Confirmada',
        }),
      );

      for (const habitacionId of habitacionIds) {
        await manager.save(
          ReservacionHabitacion,
          manager.create(ReservacionHabitacion, {
            reservacionId: reservacion.id,
            habitacionId,
            precio: Number(data.precio || 0),
          }),
        );
      }

      const estado = await manager.findOne(EstadoHabitacion, {
        where: {
          nombre: 'Reservada',
        },
      });

      if (estado) {
        await manager.update(Habitacion, habitacionIds, {
          estadoId: estado.id,
        });
      }

      return reservacion;
    });
  }

  async modificar(id: number, data: any, usuarioId: number) {
    this.validarDatos(data);
    const actual = await this.reservaciones.findOneBy({ id });
    if (!actual) throw new NotFoundException('Reservación no encontrada');
    if (['Finalizada', 'Cancelada'].includes(actual.estado)) {
      throw new BadRequestException('Esta reservación ya no puede modificarse');
    }

    const nuevosIds = (data.habitacionIds ?? []).map(Number);
    if (!nuevosIds.length) {
      throw new BadRequestException('Selecciona al menos una habitación');
    }

    const enlacesActuales = await this.enlaces.findBy({ reservacionId: id });
    const actualesIds = enlacesActuales.map((enlace) => enlace.habitacionId);

    const disponibles = await this.disponibles(data.fechaInicio, data.fechaFin);
    const permitidas = new Set([
      ...disponibles.map((habitacion) => habitacion.id),
      ...actualesIds,
    ]);
    if (
      nuevosIds.some((habitacionId: number) => !permitidas.has(habitacionId))
    ) {
      throw new BadRequestException('Una habitación ya no está disponible');
    }

    return this.dataSource.transaction(async (manager) => {
      let huespedId = Number(data.huespedId || actual.huespedId);
      if (data.huesped) {
        if (huespedId) {
          await manager.update(
            Huesped,
            huespedId,
            this.normalizarHuesped(data.huesped),
          );
        } else {
          const huesped = await manager.save(
            Huesped,
            manager.create(Huesped, this.normalizarHuesped(data.huesped)),
          );
          huespedId = huesped.id;
        }
      }

      await manager.update(Reservacion, id, {
        huespedId,
        usuarioId,
        fechaInicio: data.fechaInicio,
        fechaFin: data.fechaFin,
        adultos: Number(data.adultos || 1),
        menores: Number(data.menores || 0),
      });

      await manager.delete(ReservacionHabitacion, { reservacionId: id });
      for (const habitacionId of nuevosIds) {
        await manager.save(
          ReservacionHabitacion,
          manager.create(ReservacionHabitacion, {
            reservacionId: id,
            habitacionId,
            precio: Number(data.precio || 0),
          }),
        );
      }

      const liberadas = actualesIds.filter(
        (habitacionId) => !nuevosIds.includes(habitacionId),
      );
      const disponible = await manager.findOne(EstadoHabitacion, {
        where: { nombre: 'Disponible' },
      });
      if (disponible && liberadas.length) {
        await manager.update(Habitacion, liberadas, {
          estadoId: disponible.id,
        });
      }

      const nombreEstado =
        actual.estado === 'Confirmada'
          ? 'Reservada'
          : 'En proceso de reservación';
      const estadoHabitacion = await manager.findOne(EstadoHabitacion, {
        where: { nombre: nombreEstado },
      });
      if (estadoHabitacion) {
        await manager.update(Habitacion, nuevosIds, {
          estadoId: estadoHabitacion.id,
        });
      }

      return manager.findOneBy(Reservacion, { id });
    });
  }

  async estado(id: number, estado: string) {
    const permitidos = ['En proceso', 'Confirmada', 'Cancelada'];
    if (!permitidos.includes(estado)) {
      throw new BadRequestException('Estado de reservación inválido');
    }

    const reservacion = await this.reservaciones.findOneBy({ id });
    if (!reservacion) throw new NotFoundException('Reservación no encontrada');

    reservacion.estado = estado;
    await this.reservaciones.save(reservacion);

    const enlaces = await this.enlaces.findBy({ reservacionId: id });
    const nombre =
      estado === 'Cancelada'
        ? 'Disponible'
        : estado === 'Confirmada'
          ? 'Reservada'
          : 'En proceso de reservación';
    const estadoHabitacion = await this.estados.findOneBy({ nombre });
    if (estadoHabitacion && enlaces.length) {
      await this.habitaciones.update(
        enlaces.map((enlace) => enlace.habitacionId),
        { estadoId: estadoHabitacion.id },
      );
    }

    return reservacion;
  }

  async liberarExpiradas() {
    await this.dataSource.query(
      `UPDATE habitaciones h
       JOIN reservacion_habitaciones rh ON rh.habitacion_id=h.id
       JOIN reservaciones r ON r.id=rh.reservacion_id
       JOIN estados_habitacion e ON e.nombre='Disponible'
       SET h.estado_id=e.id,r.estado='Cancelada'
       WHERE r.estado='En proceso'
       AND r.created_at < DATE_SUB(NOW(),INTERVAL 15 MINUTE)`,
    );
    return { message: 'Bloqueos vencidos liberados' };
  }

  async eliminar(id: number) {
    const reservacion = await this.reservaciones.findOneBy({ id });
    if (!reservacion) throw new NotFoundException('Reservación no encontrada');

    return this.dataSource.transaction(async (manager) => {
      const enlaces = await manager.findBy(ReservacionHabitacion, {
        reservacionId: id,
      });
      const habitacionIds = enlaces.map((enlace) => enlace.habitacionId);

      await manager.delete(ReservacionHabitacion, { reservacionId: id });
      await manager.delete(Reservacion, id);

      const disponible = await manager.findOne(EstadoHabitacion, {
        where: { nombre: 'Disponible' },
      });
      if (disponible && habitacionIds.length) {
        await manager.update(Habitacion, habitacionIds, {
          estadoId: disponible.id,
        });
      }

      return { message: 'Reservación eliminada' };
    });
  }

  async bloquearHabitacion(id: number) {
    const disponible = await this.estados.findOneBy({ nombre: 'Disponible' });
    const enProceso = await this.estados.findOneBy({
      nombre: 'En proceso de reservación',
    });
    if (!disponible || !enProceso) {
      throw new BadRequestException('Estados de habitación no configurados');
    }
    const resultado = await this.habitaciones.update(
      { id, estadoId: disponible.id, activa: true },
      { estadoId: enProceso.id },
    );
    if (!resultado.affected) {
      throw new BadRequestException(
        'La habitación acaba de ser seleccionada por otra persona',
      );
    }
    return { message: 'Habitación bloqueada temporalmente' };
  }

  async desbloquearHabitacion(id: number) {
    const disponible = await this.estados.findOneBy({ nombre: 'Disponible' });
    const enProceso = await this.estados.findOneBy({
      nombre: 'En proceso de reservación',
    });
    if (disponible && enProceso) {
      await this.habitaciones.update(
        { id, estadoId: enProceso.id },
        { estadoId: disponible.id },
      );
    }
    return { message: 'Bloqueo liberado' };
  }

  private validarDatos(data: any) {
    if (!data.fechaInicio || !data.fechaFin) {
      throw new BadRequestException('Selecciona fecha de entrada y salida');
    }
    if (new Date(data.fechaFin) <= new Date(data.fechaInicio)) {
      throw new BadRequestException(
        'La salida debe ser posterior a la entrada',
      );
    }
  }

  private normalizarHuesped(data: any): Partial<Huesped> {
    const nombre = String(data.nombre || '').trim();
    const apellidoPaterno = String(data.apellidoPaterno || '').trim();
    const telefono = String(data.telefono || '').trim();
    if (!nombre || !apellidoPaterno || !telefono) {
      throw new BadRequestException(
        'Nombre, apellido paterno y teléfono del huésped son obligatorios',
      );
    }
    return {
      nombre,
      apellidoPaterno,
      apellidoMaterno: String(data.apellidoMaterno || '').trim() || undefined,
      telefono,
      correo: String(data.correo || '').trim() || undefined,
      direccion: String(data.direccion || '').trim() || undefined,
      identificacion: String(data.identificacion || '').trim() || undefined,
    };
  }
}
