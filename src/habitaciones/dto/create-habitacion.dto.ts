import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateHabitacionDto {
  @Transform(({ value }) => String(value ?? '').trim())
  @IsString()
  @IsNotEmpty({ message: 'El número de habitación es obligatorio' })
  @MaxLength(4, {
    message: 'El número de habitación no puede superar los 4 digitos',
  })
  numero!: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El piso debe ser un número entero' })
  @Min(0, { message: 'El piso no puede ser negativo' })
  @Max(100, { message: 'El piso no puede superar 20' })
  piso?: number | null;

  @Type(() => Number)
  @IsInt({ message: 'El tipo de habitación debe ser válido' })
  @Min(1, { message: 'Selecciona un tipo de habitación válido' })
  tipoId!: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'El estado debe ser válido' })
  @Min(1, { message: 'Selecciona un estado válido' })
  estadoId?: number;

  @IsOptional()
  @Transform(({ value }) => {
    const texto = String(value ?? '').trim();
    return texto === '' ? null : texto;
  })
  @IsString()
  @MaxLength(1000, {
    message: 'Las observaciones no pueden superar los 1000 caracteres',
  })
  observaciones?: string | null;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activa?: boolean;
}
