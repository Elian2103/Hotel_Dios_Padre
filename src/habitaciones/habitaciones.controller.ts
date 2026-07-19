import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { mkdirSync } from 'fs';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { HabitacionesService } from './habitaciones.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UsuarioActual } from '../common/decorators/usuario-actual.decorator';

const directorioFotos = join(
  __dirname,
  '..',
  '..',
  'public',
  'uploads',
  'habitaciones',
);
mkdirSync(directorioFotos, { recursive: true });

const almacenamientoFotos = diskStorage({
  destination: directorioFotos,
  filename: (_request, file, callback) => {
    const nombre = `habitacion-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `${nombre}${extname(file.originalname).toLowerCase()}`);
  },
});

@Controller('habitaciones')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HabitacionesController {
  constructor(private readonly service: HabitacionesService) {}

  @Get()
  @Roles('Administrador', 'Taquilla')
  todas() {
    return this.service.todas();
  }

  @Get('mis-asignadas')
  @Roles('Camarista')
  mias(@UsuarioActual() usuario: any) {
    return this.service.asignadas(usuario.id);
  }

  @Get(':id')
  @Roles('Administrador')
  una(@Param('id', ParseIntPipe) id: number) {
    return this.service.una(id);
  }

  @Post()
  @Roles('Administrador')
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Patch(':id')
  @Roles('Administrador')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Post(':id/foto')
  @Roles('Administrador')
  @UseInterceptors(
    FileInterceptor('foto', {
      storage: almacenamientoFotos,
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_request, file, callback) => {
        const permitidos = ['image/jpeg', 'image/png', 'image/webp'];
        callback(null, permitidos.includes(file.mimetype));
      },
    }),
  )
  subirFoto(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException(
        'Selecciona una imagen JPG, PNG o WEBP de máximo 5 MB',
      );
    }
    return this.service.guardarFoto(
      id,
      `/uploads/habitaciones/${file.filename}`,
    );
  }

  @Delete(':id/foto')
  @Roles('Administrador')
  eliminarFoto(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminarFoto(id);
  }

  @Patch(':id/estado')
  @Roles('Administrador')
  estado(
    @Param('id', ParseIntPipe) id: number,
    @Body('estadoId') estadoId: number,
  ) {
    return this.service.estado(id, estadoId);
  }

  @Delete(':id')
  @Roles('Administrador')
  eliminar(@Param('id', ParseIntPipe) id: number) {
    return this.service.eliminar(id);
  }

  @Patch(':id/restaurar')
  @Roles('Administrador')
  restaurar(@Param('id', ParseIntPipe) id: number) {
    return this.service.restaurar(id);
  }
}
