import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('checkin')
export class Checkin {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'reservacion_id', nullable: true }) reservacionId: number;
  @Column({ type: 'datetime', nullable: true }) fecha: Date;
  @Column({ name: 'usuario_id', nullable: true }) usuarioId: number;
  @Column({ type: 'text', nullable: true }) observaciones: string;
}
