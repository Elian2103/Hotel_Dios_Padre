import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('reservaciones')
export class Reservacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) folio: string;
  @Column({ name: 'huesped_id', nullable: true }) huespedId: number;
  @Column({ name: 'usuario_id', nullable: true }) usuarioId: number;
  @Column({ name: 'fecha_inicio', type: 'date', nullable: true })
  fechaInicio: string;
  @Column({ name: 'fecha_fin', type: 'date', nullable: true }) fechaFin: string;
  @Column({ nullable: true }) adultos: number;
  @Column({ nullable: true }) menores: number;
  @Column({
    type: 'enum',
    enum: ['En proceso', 'Confirmada', 'Cancelada', 'Finalizada'],
    nullable: true,
  })
  estado: string;
  @Column({
    name: 'created_at',
    type: 'timestamp',
    insert: false,
    update: false,
  })
  createdAt: Date;
}
