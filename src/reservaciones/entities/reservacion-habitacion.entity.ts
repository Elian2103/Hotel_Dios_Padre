import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('reservacion_habitaciones')
export class ReservacionHabitacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'reservacion_id', nullable: true }) reservacionId: number;
  @Column({ name: 'habitacion_id', nullable: true }) habitacionId: number;
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  precio: number;
}
