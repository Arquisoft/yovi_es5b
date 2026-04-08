# Yovi_es5b - Game Y at UniOvi

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_es5b/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_es5b/actions/workflows/release-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es5b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es5b)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es5b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es5b)

[Deployment in Azure](http://20.199.9.107)

[Documentation](https://arquisoft.github.io/yovi_es5b/)

[Decision log](https://github.com/Arquisoft/yovi_es5b/wiki/Registro-de-Decisiones)

## Contributors

| Name  | UO  | Github username |
|---|---|---|
| **Alejandro** Aloso Bayón | UO300216 | [alonsobayonalejandro-ctrl](https://github.com/alonsobayonalejandro-ctrl) |
| **Antonio** Postigo de Diego | UO265373  | [tonipdd](https://github.com/tonipdd) |
| **Guillermo** Gil Naves | UO300475 | [UO300475](https://github.com/UO300475) |
| **Ignacio** Torre Suárez | UO245469 | [NachoTS](https://github.com/NachoTS) |
| **Pedro** Díaz González | UO294790 | [Gedepe](https://github.com/Gedepe) |

## Project Structure

El proyecto se divide en cuatro subdirectorios principales:

- `webapp/`: Frontend de la aplicación hecho en React + TypeScript con Vite.
- `users/`: Backend de gestión de usuarios hecho en Express.js
- `gamey/`: Backend del juego hecho en Rust.
- `database/`: archivos necesarios para lanzar el contenedor de la base de datos MySQL.
- `docs/`: Documentación arquitectónica usando la plantilla arc42.

## Componentes

### Webapp

`webapp` es una single-page application (SPA) creada con [Vite](https://vitejs.dev/) y [React](https://reactjs.org/).

- `src/App.tsx`: Componente principal de la aplicación.
- `package.json`: Contiene los scripts necesarios para ejecutar, compilar y probar webapp.
- `vite.config.ts`: Archivo de configuración para Vite.
- `Dockerfile`: Archivo que define la imagen de Docker para webapp.

### Users

`users` es una API implementada usando [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/).

- `users-service.js`: Archivo principal de `users` desde donde se lanzará el módulo.
- `package.json`: Contiene los scripts necesarios para iniciar y probar el servicio.
- `Dockerfile`: Archivo que define la imagen de Docker para users.

### Gamey

`gamey` es el módulo del juego con soporte para bots hecho con [Rust](https://www.rust-lang.org/) y [Cargo](https://doc.rust-lang.org/cargo/).

- `src/main.rs`: Punto de entrada principal de la aplicación.
- `src/lib.rs`: Biblioteca del motor de juego.
- `src/bot/`: Registro e implementación de bots.
- `src/core/`: Lógica base del juego, incluyendo acciones, coordenadas, estado y gestión de jugadores.
- `src/notation/`: Notación del juego (YEN, YGN).
- `Cargo.toml`: Dependencias y metadatos del módulo.
- `Dockerfile`: Archivo que define la imagen de Docker para gamey.

### database

`database` es el submódulo que contiene la información necesaria para arrancar la base de datos MySQL de `users`.

- `Dockerfile`: Archivo que define la imagen de MySQL para gamey.

## Ejecutar el proyecto

Se puede ejecutar el proyecto en local usando Docker o sin Docker. Si da problemas con Docker, probar a ejecutarlo de la otra forma.

### Sin Docker

1. **Base de datos**: sobre el directorio base: lanzar el contenedor de la base de datos con `docker-compose -f docker-compose.yml up -d database`
2. **Módulo gamey**: sobre el directorio `gamey`: ejecutar `cargo run -- --mode server --port 4000`
3. **Módulo users**: sobre el directorio `users`: ejecutar `npm run start`
4. **Módulo webapp**: sobre el directorio `webapp`: ejecutar `npm run dev`

Finalmente, entrar en [http://localhost:5173/](http://localhost:5173/).

**NOTA**: recordar ejecutar **npm install** en `users` y `webapp` por si hay alguna dependencia nueva pendiente de instalar.

**NOTA**: como arreglo temporal para que arranque la base de datos en local, cambiar en `users/config/db.js`, línea 7, el valor de la IP por `127.0.0.1`. **No subir este cambio a master**.

### With Docker

This is the easiest way to get the project running. You need to have [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed.

1. **Build and run the containers:**
    From the root directory of the project, run:

```bash
docker-compose up --build
```

This command will build the Docker images for both the `webapp` and `users` services and start them.

2.**Access the application:**
- Web application: [http://localhost](http://localhost)
- User service API: [http://localhost:3000](http://localhost:3000)
- Gamey API: [http://localhost:4000](http://localhost:4000)

## Scripts disponibles

Cada módulo posee su conjunto de scripts. A continuación se listan los scripts de cada módulo:

### Webapp (`webapp/package.json`)

- `npm run dev`: Starts the development server for the webapp.
- `npm test`: Runs the unit tests.
- `npm run test:e2e`: Runs the end-to-end tests.
- `npm run start:all`: A convenience script to start both the `webapp` and the `users` service concurrently.

### Users (`users/package.json`)

- `npm start`: Starts the user service.
- `npm test`: Runs the tests for the service.

### Gamey (`gamey/Cargo.toml`)

- `cargo build`: Builds the gamey application.
- `cargo test`: Runs the unit tests.
- `cargo run`: Runs the gamey application.
- `cargo doc`: Generates documentation for the GameY engine application
