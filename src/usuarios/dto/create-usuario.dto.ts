import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

const REGEX_NOMBRE =
  /^[A-Za-zÁÉÍÓÚáéíóúÑñÜü]+(?:[ '-][A-Za-zÁÉÍÓÚáéíóúÑñÜü]+)*$/;

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimLowerCase = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const emptyToUndefined = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;

  const normalized = value.trim();
  return normalized === '' ? undefined : normalized;
};

export class CreateUsuarioDto {
  @Transform(trim)
  @IsString({ message: 'El nombre debe ser texto' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @Matches(REGEX_NOMBRE, {
    message:
      'El nombre solo puede contener letras, espacios, guiones y apóstrofes',
  })
  @MinLength(2, {
    message: 'El nombre debe contener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El nombre no puede superar los 100 caracteres',
  })
  nombre!: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString({ message: 'El apellido paterno debe ser texto' })
  @Matches(REGEX_NOMBRE, {
    message:
      'El apellido paterno solo puede contener letras, espacios, guiones y apóstrofes',
  })
  @MinLength(2, {
    message: 'El apellido paterno debe contener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El apellido paterno no puede superar los 100 caracteres',
  })
  apellidoPaterno?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @IsString({ message: 'El apellido materno debe ser texto' })
  @Matches(REGEX_NOMBRE, {
    message:
      'El apellido materno solo puede contener letras, espacios, guiones y apóstrofes',
  })
  @MinLength(2, {
    message: 'El apellido materno debe contener al menos 2 caracteres',
  })
  @MaxLength(100, {
    message: 'El apellido materno no puede superar los 100 caracteres',
  })
  apellidoMaterno?: string;

  @Transform(emptyToUndefined)
  @IsOptional()
  @Matches(/^\d{10}$/, {
    message: 'El teléfono debe contener exactamente 10 dígitos',
  })
  telefono?: string;

  @Transform(({ value }) => {
    if (typeof value !== 'string') return value;

    const normalized = value.trim().toLowerCase();
    return normalized === '' ? undefined : normalized;
  })
  @IsOptional()
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(150, {
    message: 'El correo no puede superar los 150 caracteres',
  })
  correo?: string;

  @Transform(trimLowerCase)
  @IsString({ message: 'El usuario debe ser texto' })
  @IsNotEmpty({ message: 'El usuario es obligatorio' })
  @MinLength(4, {
    message: 'El usuario debe contener al menos 4 caracteres',
  })
  @MaxLength(100, {
    message: 'El usuario no puede superar los 100 caracteres',
  })
  @Matches(/^[a-z0-9._-]+$/, {
    message:
      'El usuario solo puede contener letras, números, puntos, guiones y guiones bajos',
  })
  usuario!: string;

  @IsString({ message: 'La contraseña debe ser texto' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MinLength(8, {
    message: 'La contraseña debe contener al menos 8 caracteres',
  })
  @MaxLength(72, {
    message: 'La contraseña no puede superar los 72 caracteres',
  })
  password!: string;

  @Type(() => Number)
  @IsInt({ message: 'El rol debe ser un número entero' })
  @Min(1, { message: 'El rol seleccionado no es válido' })
  rolId!: number;

  @IsOptional()
  @IsBoolean({ message: 'El estado activo debe ser verdadero o falso' })
  activo?: boolean;
}
