import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('observaciones')
export class Observacion {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'habitacion_id', nullable: true }) habitacionId: number;
  @Column({ name: 'usuario_id', nullable: true }) usuarioId: number;
  @Column({
    type: 'enum',
    enum: ['Recepción', 'Camarista', 'Administrador'],
    nullable: true,
  })
  tipo: string;
  @Column({ type: 'text', nullable: true }) descripcion: string;
  @Column({
    name: 'created_at',
    type: 'timestamp',
    insert: false,
    update: false,
  })
  createdAt: Date;
}
