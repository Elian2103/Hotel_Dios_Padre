import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('huespedes')
export class Huesped {
  @PrimaryGeneratedColumn() id: number;
  @Column({ nullable: true }) nombre: string;
  @Column({ name: 'apellido_paterno', nullable: true }) apellidoPaterno: string;
  @Column({ name: 'apellido_materno', nullable: true }) apellidoMaterno: string;
  @Column({ nullable: true }) telefono: string;
  @Column({ nullable: true }) correo: string;
  @Column({ type: 'text', nullable: true }) direccion: string;
  @Column({ nullable: true }) identificacion: string;
  @Column({
    name: 'created_at',
    type: 'timestamp',
    insert: false,
    update: false,
  })
  createdAt: Date;
}
