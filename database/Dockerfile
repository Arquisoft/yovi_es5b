FROM mysql:8.0

ARG MYSQL_ROOT_PASSWORD
ARG MYSQL_DATABASE

ENV MYSQL_ROOT_PASSWORD=$MYSQL_ROOT_PASSWORD
ENV MYSQL_DATABASE=$MYSQL_DATABASE
ENV MYSQL_ROOT_HOST=%

# Crear archivo de configuración MySQL
RUN echo '[mysqld]' > /etc/mysql/conf.d/mysql.cnf && \
    echo 'bind-address=0.0.0.0' >> /etc/mysql/conf.d/mysql.cnf && \
    echo 'default_authentication_plugin=mysql_native_password' >> /etc/mysql/conf.d/mysql.cnf

# Script de inicialización para resetear permisos de root
COPY init.sql /docker-entrypoint-initdb.d/

EXPOSE 3306
