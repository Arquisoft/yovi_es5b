-- Resetear permisos de root para todas las direcciones
DELETE FROM mysql.user WHERE User='root' AND Host != 'localhost';
ALTER USER 'root'@'localhost' IDENTIFIED BY 'ADMSIS123$';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED BY 'ADMSIS123$';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;
FLUSH PRIVILEGES;
