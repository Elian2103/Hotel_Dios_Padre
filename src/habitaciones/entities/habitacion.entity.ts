import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { EstadoHabitacion } from './estado-habitacion.entity';
import { AsignacionLimpieza } from '../../asignaciones-limpieza/entities/asignacion-limpieza.entity';
import { TipoHabitacion } from '../../tiposhabitacion/entities/tipo-habitacion.entity';

@Entity('habitaciones')
export class Habitacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 20,
    unique: true,
  })
  numero!: string;

  @Column({
    type: 'int',
    nullable: true,
  })
  piso!: number | null;

  @Column({
    name: 'tipo_id',
    type: 'int',
    nullable: true,
  })
  tipoId!: number | null;

  @Column({
    name: 'estado_id',
    type: 'int',
    nullable: true,
  })
  estadoId!: number | null;

  @Column({
    type: 'text',
    nullable: true,
  })
  observaciones!: string | null;

  @Column({
    name: 'foto_url',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  fotoUrl!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  activa!: boolean;

  @ManyToOne(() => EstadoHabitacion, (estado) => estado.habitaciones, {
    nullable: true,
  })
  @JoinColumn({
    name: 'estado_id',
  })
  estado!: EstadoHabitacion | null;

  @ManyToOne(() => TipoHabitacion, {
    nullable: true,
  })
  @JoinColumn({
    name: 'tipo_id',
  })
  tipo!: TipoHabitacion | null;

  @OneToMany(() => AsignacionLimpieza, (asignacion) => asignacion.habitacion)
  asignaciones!: AsignacionLimpieza[];
}
