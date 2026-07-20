import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CambiarEstadoHabitacionDto {
  @Type(() => Number)
  @IsInt({ message: 'El estado debe ser un número entero' })
  @Min(1, { message: 'Selecciona un estado válido' })
  estadoId!: number;
}
