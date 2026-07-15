import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('tipos_habitacion')
export class TipoHabitacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 60, nullable: true }) nombre: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({ nullable: true }) capacidad: number;
  @Column({ nullable: true }) camas: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio: number;
  @Column({ default: true }) activo: boolean;
}
