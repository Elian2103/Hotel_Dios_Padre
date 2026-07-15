import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
@Entity('bitacora')
export class Bitacora {
  @PrimaryGeneratedColumn() id: number;
  @Column({ name: 'usuario_id', nullable: true }) usuarioId: number;
  @Column({ nullable: true }) modulo: string;
  @Column({ nullable: true }) accion: string;
  @Column({ type: 'timestamp', insert: false, update: false }) fecha: Date;
}
