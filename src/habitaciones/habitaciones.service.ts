import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Habitacion } from './entities/habitacion.entity';

@Injectable()
export class HabitacionesService {
  constructor(
    @InjectRepository(Habitacion)
    private readonly repo: Repository<Habitacion>,
  ) {}

  todas() {
    return this.repo.find({
      relations: { estado: true, tipo: true },
      order: { numero: 'ASC' },
    });
  }

  una(id: number) {
    return this.repo.findOne({
      where: { id },
      relations: { estado: true, tipo: true },
    });
  }

  asignadas(id: number) {
    return this.repo
      .createQueryBuilder('h')
      .leftJoinAndSelect('h.estado', 'estado')
      .leftJoinAndSelect('h.tipo', 'tipo')
      .innerJoinAndSelect('h.asignaciones', 'a', 'a.camarista_id=:id', { id })
      .where('h.activa=1')
      .andWhere('a.fecha=CURDATE()')
      .andWhere("a.estado <> 'Finalizada'")
      .orderBy('h.numero', 'ASC')
      .getMany();
  }

  async create(data: Partial<Habitacion>) {
    const numero = String(data.numero ?? '').trim();
    if (!numero) throw new BadRequestException('El número es obligatorio');

    const existente = await this.repo.findOneBy({ numero });
    if (existente) {
      throw new BadRequestException('Número de habitación existente');
    }

    return this.repo.save(
      this.repo.create({
        ...data,
        numero,
        piso:
          data.piso === null || data.piso === undefined
            ? null
            : Number(data.piso),
        tipoId: data.tipoId ? Number(data.tipoId) : null,
        estadoId: data.estadoId ? Number(data.estadoId) : 1,
        activa: data.activa ?? true,
      }),
    );
  }

  async update(id: number, data: Partial<Habitacion>) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');

    if (data.numero && data.numero !== habitacion.numero) {
      const repetida = await this.repo.findOneBy({
        numero: String(data.numero),
      });
      if (repetida && repetida.id !== id) {
        throw new BadRequestException('Número de habitación existente');
      }
    }

    const cambios: Partial<Habitacion> = {
      ...data,
      piso: data.piso === undefined ? habitacion.piso : Number(data.piso),
      tipoId:
        data.tipoId === undefined ? habitacion.tipoId : Number(data.tipoId),
      estadoId:
        data.estadoId === undefined
          ? habitacion.estadoId
          : Number(data.estadoId),
    };

    await this.repo.update(id, cambios);
    return this.una(id);
  }

  async guardarFoto(id: number, fotoUrl: string) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');
    await this.repo.update(id, { fotoUrl });
    return this.una(id);
  }

  async eliminarFoto(id: number) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');
    await this.repo.update(id, { fotoUrl: null });
    return this.una(id);
  }

  async estado(id: number, estadoId: number) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');
    await this.repo.update(id, { estadoId: Number(estadoId) });
    return this.una(id);
  }

  async eliminar(id: number) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');

    // Eliminación lógica para conservar historiales de reservación, limpieza y reportes.
    await this.repo.update(id, { activa: false });
    return { message: 'Habitación eliminada correctamente' };
  }

  async restaurar(id: number) {
    const habitacion = await this.repo.findOneBy({ id });
    if (!habitacion) throw new NotFoundException('Habitación no encontrada');
    await this.repo.update(id, { activa: true });
    return this.una(id);
  }
}
