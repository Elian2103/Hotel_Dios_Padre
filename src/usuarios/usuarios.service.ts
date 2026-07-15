import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Rol } from '../roles/entities/rol.entity';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class UsuariosService {
  constructor(
    @InjectRepository(Usuario)
    private readonly repo: Repository<Usuario>,
    @InjectRepository(Rol)
    private readonly roles: Repository<Rol>,
  ) {}

  findAll() {
    return this.repo
      .createQueryBuilder('u')
      .leftJoinAndSelect('u.rol', 'rol')
      .select([
        'u.id',
        'u.nombre',
        'u.apellidoPaterno',
        'u.apellidoMaterno',
        'u.telefono',
        'u.correo',
        'u.usuario',
        'u.rolId',
        'u.activo',
        'rol.id',
        'rol.nombre',
      ])
      .orderBy('u.id', 'DESC')
      .getMany();
  }

  findRoles() {
    return this.roles.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  private normalize(data: any): any {
    const normalized = {
      ...data,
      nombre: data.nombre?.trim() || null,
      apellidoPaterno: data.apellidoPaterno?.trim() || null,
      apellidoMaterno: data.apellidoMaterno?.trim() || null,
      telefono: data.telefono?.trim() || null,
      correo: data.correo?.trim() || null,
      usuario: data.usuario?.trim(),
      rolId: data.rolId ? Number(data.rolId) : undefined,
    };
    delete normalized.id;
    delete normalized.rol;

    if (!normalized.usuario) {
      throw new BadRequestException('El usuario es obligatorio');
    }

    if (!normalized.rolId) {
      throw new BadRequestException('El rol es obligatorio');
    }

    return normalized;
  }

  async create(data: any) {
    const normalized = this.normalize(data);
    if (!data.password) {
      throw new BadRequestException('La contrasena es obligatoria');
    }

    const conditions: any[] = [{ usuario: normalized.usuario }];
    if (normalized.correo) conditions.push({ correo: normalized.correo });

    if (await this.repo.findOne({ where: conditions })) {
      throw new BadRequestException('Usuario o correo registrado');
    }

    normalized.password = await bcrypt.hash(data.password, 10);
    return this.repo.save(this.repo.create(normalized));
  }

  async update(id: number, data: any) {
    const usuario = await this.repo.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');

    const normalized = this.normalize({
      ...usuario,
      ...data,
    });

    if (
      await this.repo.findOne({
        where: { usuario: normalized.usuario, id: Not(id) },
      })
    ) {
      throw new BadRequestException('Usuario registrado');
    }

    if (
      normalized.correo &&
      (await this.repo.findOne({
        where: { correo: normalized.correo, id: Not(id) },
      }))
    ) {
      throw new BadRequestException('Correo registrado');
    }

    if (data.password) {
      normalized.password = await bcrypt.hash(data.password, 10);
    } else {
      delete normalized.password;
    }

    await this.repo.update(id, normalized);
    return { message: 'Usuario actualizado' };
  }

  async toggle(id: number) {
    const usuario = await this.repo.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.activo = !usuario.activo;
    await this.repo.save(usuario);
    return { activo: usuario.activo };
  }

  async remove(id: number) {
    const usuario = await this.repo.findOneBy({ id });
    if (!usuario) throw new NotFoundException('Usuario no encontrado');
    usuario.activo = false;
    await this.repo.save(usuario);
    return { message: 'Usuario eliminado' };
  }
}
