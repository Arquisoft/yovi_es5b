-- Resetear permisos de root para todas las direcciones
USE mysql;
DELETE FROM user WHERE User='root' AND Host NOT IN ('localhost', '%');
update user set host='%' where user='root';
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'ADMSIS123$';
CREATE USER IF NOT EXISTS 'root'@'%' IDENTIFIED WITH mysql_native_password BY 'ADMSIS123$';
GRANT ALL PRIVILEGES ON *.* TO 'root'@'%' WITH GRANT OPTION;
GRANT ALL PRIVILEGES ON *.* TO 'root'@'localhost' WITH GRANT OPTION;

FLUSH PRIVILEGES;
