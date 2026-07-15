USE hotel_dios_padre;

ALTER TABLE habitaciones
  ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255) NULL AFTER observaciones;
