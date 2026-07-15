import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Habitacion } from '../../habitaciones/entities/habitacion.entity';
import { Usuario } from '../../usuarios/entities/usuario.entity';
@Entity('asignaciones_limpieza')
export class AsignacionLimpieza {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'habitacion_id', nullable: true }) habitacionId: number;
  @Column({ name: 'camarista_id', nullable: true }) camaristaId: number;
  @Column({ type: 'date', nullable: true }) fecha: string;
  @Column({
    type: 'enum',
    enum: ['Pendiente', 'En proceso', 'Finalizada'],
    nullable: true,
  })
  estado: string;
  @ManyToOne(() => Habitacion, (h) => h.asignaciones)
  @JoinColumn({ name: 'habitacion_id' })
  habitacion: Habitacion;
  @ManyToOne(() => Usuario, (u) => u.asignaciones)
  @JoinColumn({ name: 'camarista_id' })
  camarista: Usuario;
}
