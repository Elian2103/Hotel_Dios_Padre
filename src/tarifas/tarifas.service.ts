import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tarifa } from './entities/tarifa.entity';
@Injectable()
export class TarifasService {
  constructor(@InjectRepository(Tarifa) private repo: Repository<Tarifa>) {}
  findAll() {
    return this.repo.find({ order: { id: 'DESC' } });
  }
  async findOne(id: number) {
    const x = await this.repo.findOneBy({ id });
    if (!x) throw new NotFoundException('Registro no encontrado');
    return x;
  }
  create(dto: any) {
    return this.repo.save(this.repo.create(dto));
  }
  async update(id: number, dto: any) {
    await this.findOne(id);
    await this.repo.update(id, dto);
    return this.findOne(id);
  }
  async remove(id: number) {
    await this.findOne(id);
    await this.repo.delete(id);
    return { message: 'Registro eliminado' };
  }
}
