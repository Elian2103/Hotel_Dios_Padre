import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { Habitacion } from './habitacion.entity';
@Entity('estados_habitacion')
export class EstadoHabitacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 50 }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string | null;
  @OneToMany(() => Habitacion, (h) => h.estado) habitaciones: Habitacion[];
}
