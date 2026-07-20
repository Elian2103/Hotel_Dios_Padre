import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';

import { Habitacion } from './entities/habitacion.entity';
import { EstadoHabitacion } from './entities/estado-habitacion.entity';
import { TipoHabitacion } from '../tiposhabitacion/entities/tipo-habitacion.entity';

import { CreateHabitacionDto } from './dto/create-habitacion.dto';
import { UpdateHabitacionDto } from './dto/update-habitacion.dto';

@Injectable()
export class HabitacionesService {
  constructor(
    @InjectRepository(Habitacion)
    private readonly habitacionesRepo: Repository<Habitacion>,

    @InjectRepository(EstadoHabitacion)
    private readonly estadosRepo: Repository<EstadoHabitacion>,

    @InjectRepository(TipoHabitacion)
    private readonly tiposRepo: Repository<TipoHabitacion>,
  ) {}

  todas() {
    return this.habitacionesRepo.find({
      relations: {
        estado: true,
        tipo: true,
      },
      order: {
        numero: 'ASC',
      },
    });
  }

  async una(id: number) {
    const habitacion = await this.habitacionesRepo.findOne({
      where: { id },
      relations: {
        estado: true,
        tipo: true,
      },
    });

    if (!habitacion) {
      throw new NotFoundException('Habitación no encontrada');
    }

    return habitacion;
  }

  asignadas(id: number) {
    return this.habitacionesRepo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.estado', 'estado')
      .leftJoinAndSelect('h.tipo', 'tipo')
      .innerJoinAndSelect('h.asignaciones', 'a', 'a.camarista_id = :id', {
        id,
      })
      .where('h.activa = 1')
      .andWhere('a.fecha = CURDATE()')
      .andWhere("a.estado <> 'Finalizada'")
      .orderBy('h.numero', 'ASC')
      .getMany();
  }

  async create(data: CreateHabitacionDto) {
    const numero = data.numero.trim();

    await this.validarNumeroUnico(numero);
    await this.validarTipo(data.tipoId);

    const estadoId = data.estadoId ?? 1;
    await this.validarEstado(estadoId);

    const habitacion = this.habitacionesRepo.create({
      numero,
      piso: data.piso ?? null,
      tipoId: data.tipoId,
      estadoId,
      observaciones: data.observaciones ?? null,
      activa: data.activa ?? true,
    });

    const guardada = await this.habitacionesRepo.save(habitacion);

    return this.una(guardada.id);
  }

  async update(id: number, data: UpdateHabitacionDto) {
    const habitacion = await this.obtenerHabitacion(id);

    if (data.numero !== undefined) {
      const numero = data.numero.trim();

      await this.validarNumeroUnico(numero, id);
      habitacion.numero = numero;
    }

    if (data.piso !== undefined) {
      habitacion.piso = data.piso;
    }

    if (data.tipoId !== undefined) {
      await this.validarTipo(data.tipoId);
      habitacion.tipoId = data.tipoId;
    }

    if (data.estadoId !== undefined) {
      await this.validarEstado(data.estadoId);
      habitacion.estadoId = data.estadoId;
    }

    if (data.observaciones !== undefined) {
      habitacion.observaciones = data.observaciones;
    }

    if (data.activa !== undefined) {
      habitacion.activa = data.activa;
    }

    await this.habitacionesRepo.save(habitacion);

    return this.una(id);
  }

  async guardarFoto(id: number, fotoUrl: string) {
    const habitacion = await this.obtenerHabitacion(id);

    habitacion.fotoUrl = fotoUrl;

    await this.habitacionesRepo.save(habitacion);

    return this.una(id);
  }

  async eliminarFoto(id: number) {
    const habitacion = await this.obtenerHabitacion(id);

    habitacion.fotoUrl = null;

    await this.habitacionesRepo.save(habitacion);

    return this.una(id);
  }

  async estado(id: number, estadoId: number) {
    const habitacion = await this.obtenerHabitacion(id);

    await this.validarEstado(estadoId);

    habitacion.estadoId = estadoId;

    await this.habitacionesRepo.save(habitacion);

    return this.una(id);
  }

  async eliminar(id: number) {
    const habitacion = await this.obtenerHabitacion(id);

    habitacion.activa = false;

    await this.habitacionesRepo.save(habitacion);

    return {
      message: 'Habitación eliminada correctamente',
    };
  }

  async restaurar(id: number) {
    const habitacion = await this.obtenerHabitacion(id);

    habitacion.activa = true;

    await this.habitacionesRepo.save(habitacion);

    return this.una(id);
  }

  private async obtenerHabitacion(id: number) {
    const habitacion = await this.habitacionesRepo.findOneBy({ id });

    if (!habitacion) {
      throw new NotFoundException('Habitación no encontrada');
    }

    return habitacion;
  }

  private async validarNumeroUnico(numero: string, idActual?: number) {
    const existente = await this.habitacionesRepo.findOne({
      where: idActual
        ? {
            numero,
            id: Not(idActual),
          }
        : {
            numero,
          },
    });

    if (existente) {
      throw new ConflictException(
        'El número de habitación ya se encuentra registrado',
      );
    }
  }

  private async validarTipo(tipoId: number) {
    const tipo = await this.tiposRepo.findOneBy({
      id: tipoId,
    });

    if (!tipo) {
      throw new NotFoundException('El tipo de habitación no existe');
    }

    if (!tipo.activo) {
      throw new ConflictException(
        'El tipo de habitación seleccionado está inactivo',
      );
    }
  }

  private async validarEstado(estadoId: number) {
    const estado = await this.estadosRepo.findOneBy({
      id: estadoId,
    });

    if (!estado) {
      throw new NotFoundException('El estado de habitación no existe');
    }
  }
}
