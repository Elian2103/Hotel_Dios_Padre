import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

import { Usuario } from '../../usuarios/entities/usuario.entity';

@Entity('roles')
export class Rol {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'varchar',
    length: 50,
    unique: true,
  })
  nombre!: string;

  @Column({
    type: 'varchar',
    length: 200,
    nullable: true,
  })
  descripcion!: string | null;

  @Column({
    type: 'boolean',
    default: true,
  })
  activo!: boolean;

  @OneToMany(() => Usuario, (usuario) => usuario.rol)
  usuarios!: Usuario[];
}
