import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { Rol } from '../../roles/entities/rol.entity';
import { AsignacionLimpieza } from '../../asignaciones-limpieza/entities/asignacion-limpieza.entity';

@Entity('usuarios')
export class Usuario {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  nombre!: string | null;

  @Column({
    name: 'apellido_paterno',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  apellidoPaterno!: string | null;

  @Column({
    name: 'apellido_materno',
    type: 'varchar',
    length: 100,
    nullable: true,
  })
  apellidoMaterno!: string | null;

  @Column({
    type: 'varchar',
    length: 20,
    nullable: true,
  })
  telefono!: string | null;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
    nullable: true,
  })
  correo!: string | null;

  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  usuario!: string;

  @Column({
    type: 'varchar',
    length: 255,
    select: false,
  })
  password!: string;

  @Column({
    name: 'rol_id',
    type: 'int',
  })
  rolId!: number;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo!: boolean;

  @ManyToOne(() => Rol, (rol) => rol.usuarios, {
    nullable: false,
    eager: false,
  })
  @JoinColumn({
    name: 'rol_id',
  })
  rol!: Rol;

  @OneToMany(() => AsignacionLimpieza, (asignacion) => asignacion.camarista)
  asignaciones!: AsignacionLimpieza[];
}
