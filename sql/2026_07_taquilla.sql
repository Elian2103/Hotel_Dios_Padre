INSERT INTO roles (nombre, descripcion, activo)
VALUES ('Taquilla', 'Consulta de habitaciones para personal de taquilla', 1)
ON DUPLICATE KEY UPDATE descripcion=VALUES(descripcion), activo=1;

INSERT INTO usuarios (nombre, correo, usuario, password, rol_id, activo)
SELECT 'Taquilla', 'taquilla@diospadre.local', 'taquilla',
       '$2b$10$HgYiHq81ur/Q5TuwiVtsHekxS3cpUBQGkm3OThQTm1EKkyB6YhqXy', id, 1
FROM roles WHERE nombre='Taquilla'
ON DUPLICATE KEY UPDATE nombre=VALUES(nombre), password=VALUES(password),
                        rol_id=VALUES(rol_id), activo=1;
