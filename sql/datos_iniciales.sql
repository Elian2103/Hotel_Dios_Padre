USE hotel_dios_padre;

INSERT INTO estados_habitacion (id,nombre,descripcion) VALUES
(1,'Disponible','La habitación está libre y puede reservarse o asignarse.'),
(2,'En proceso de reservación','Bloqueo temporal durante el proceso de reservación.'),
(3,'Reservada','Reservación confirmada pendiente de check-in.'),
(4,'Ocupada','Huésped hospedado actualmente.'),
(5,'Pendiente de limpieza','Requiere limpieza después del check-out.'),
(6,'Sucia','Asignada a limpieza y aún no atendida.'),
(7,'En proceso','La camarista está realizando la limpieza.'),
(8,'Limpia','Limpieza finalizada y lista para habilitarse.'),
(9,'Fuera de servicio','No disponible por mantenimiento o incidencia.')
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), descripcion=VALUES(descripcion);

INSERT INTO usuarios (nombre,correo,usuario,password,rol_id,activo) VALUES
('Administrador','admin@diospadre.local','admin','$2b$10$xuzoDk4S0Ue0hxpWCacTiedruY5/hfN9krLlfOjReU9vVFIz.N2va',5,1),
('Camarista Demo','camarista@diospadre.local','camarista','$2b$10$PORTnDJ9YgGxSPy/b9V6MeuPcdwF8VpbJ6RAuRKSe/glOUh3C1YlK',6,1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password=VALUES(password), rol_id=VALUES(rol_id), activo=1;

INSERT INTO tipos_habitacion (id,nombre,descripcion,capacidad,camas,precio,activo) VALUES
(1,'Estándar','Habitación estándar',2,1,850,1),(2,'Doble','Habitación con dos camas',4,2,1250,1)
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre),precio=VALUES(precio),activo=1;
INSERT INTO habitaciones (id,numero,piso,tipo_id,estado_id,activa) VALUES
(1,'101',1,1,1,1),(2,'102',1,1,1,1),(3,'201',2,2,1,1),(4,'202',2,2,9,1)
ON DUPLICATE KEY UPDATE piso=VALUES(piso),tipo_id=VALUES(tipo_id),estado_id=VALUES(estado_id),activa=1;
INSERT INTO asignaciones_limpieza (habitacion_id,camarista_id,fecha,estado)
SELECT 1,u.id,CURDATE(),'Pendiente' FROM usuarios u WHERE u.usuario='camarista' AND NOT EXISTS(SELECT 1 FROM asignaciones_limpieza a WHERE a.habitacion_id=1 AND a.camarista_id=u.id AND a.fecha=CURDATE());
