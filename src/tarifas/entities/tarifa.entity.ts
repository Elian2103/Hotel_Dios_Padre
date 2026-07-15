import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('tarifas')
export class Tarifa {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'tipo_habitacion_id', nullable: true })
  tipoHabitacionId: number;
  @Column({ length: 80, nullable: true }) temporada: string;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio: number;
  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string;
  @Column({ name: 'fecha_fin', type: 'date', nullable: true }) fechaFin: string;
}
