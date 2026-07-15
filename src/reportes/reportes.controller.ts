import { Controller, Get, UseGuards } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('reportes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('Administrador')
export class ReportesController {
  constructor(private readonly dataSource: DataSource) {}

  @Get('dashboard')
  async dash() {
    const estados = await this.dataSource.query(
      'SELECT e.nombre, COUNT(h.id) total FROM estados_habitacion e LEFT JOIN habitaciones h ON h.estado_id=e.id AND h.activa=1 GROUP BY e.id ORDER BY e.id',
    );
    const [reservaciones] = await this.dataSource.query(
      "SELECT COUNT(*) total FROM reservaciones WHERE estado='Confirmada'",
    );
    const [ocupacion] = await this.dataSource.query(
      "SELECT ROUND(100*SUM(e.nombre='Ocupada')/NULLIF(COUNT(h.id),0),2) porcentaje FROM habitaciones h JOIN estados_habitacion e ON e.id=h.estado_id WHERE h.activa=1",
    );

    return {
      estados,
      reservacionesConfirmadas: Number(reservaciones?.total || 0),
      porcentajeOcupacion: Number(ocupacion?.porcentaje || 0),
    };
  }

  @Get('ocupacion')
  ocupacion() {
    return this.dataSource.query(
      "SELECT DATE(fecha_inicio) fecha, COUNT(*) reservaciones, SUM(adultos+menores) huespedes FROM reservaciones WHERE estado IN ('Confirmada','Finalizada') GROUP BY DATE(fecha_inicio) ORDER BY fecha DESC LIMIT 90",
    );
  }

  @Get('habitaciones-utilizadas')
  habitacionesUtilizadas() {
    return this.dataSource.query(
      'SELECT h.numero, COUNT(*) usos FROM reservacion_habitaciones rh JOIN habitaciones h ON h.id=rh.habitacion_id GROUP BY h.id ORDER BY usos DESC',
    );
  }
}
