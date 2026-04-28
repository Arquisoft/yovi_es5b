# Yovi_es5b - Game Y at UniOvi

[![Release — Test, Build, Publish, Deploy](https://github.com/arquisoft/yovi_es5b/actions/workflows/release-deploy.yml/badge.svg)](https://github.com/arquisoft/yovi_es5b/actions/workflows/release-deploy.yml)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es5b&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es5b)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Arquisoft_yovi_es5b&metric=coverage)](https://sonarcloud.io/summary/new_code?id=Arquisoft_yovi_es5b)

[Enlace a la aplicación](http://20.199.9.107)

[Documentación OpenAPI](http://20.199.9.107:3000/api-docs)

[Documentación Arc42](https://arquisoft.github.io/yovi_es5b/)

[Wiki del proyecto](https://github.com/Arquisoft/yovi_es5b/wiki)

[Kanban del proyecto](https://github.com/orgs/Arquisoft/projects/221)

[Registro de decisiones (wiki)](https://github.com/Arquisoft/yovi_es5b/wiki/Registro-de-Decisiones)

## Colaboradores

| Name  | UO  | Github username |
|---|---|---|
| **Alejandro** Aloso Bayón | UO300216 | [alonsobayonalejandro-ctrl](https://github.com/alonsobayonalejandro-ctrl) |
| **Antonio** Postigo de Diego | UO265373  | [tonipdd](https://github.com/tonipdd) |
| **Guillermo** Gil Naves | UO300475 | [UO300475](https://github.com/UO300475) |
| **Ignacio** Torre Suárez | UO245469 | [NachoTS](https://github.com/NachoTS) |
| **Pedro** Díaz González | UO294790 | [Gedepe](https://github.com/Gedepe) |

## Lanzar el proyecto en local

Para lanzar el proyecto en local y acceder a la misma, [ver su entrada respectiva en la wiki](https://github.com/Arquisoft/yovi_es5b/wiki/C%C3%B3mo-lanzar-la-aplicaci%C3%B3n-en-local-(desarrollo))


## Scripts disponibles

Cada módulo posee su conjunto de scripts. A continuación se listan los scripts de cada módulo:

### Webapp (`webapp/package.json`)

- `npm run dev`: Starts the development server for the webapp.
- `npm test`: Runs the unit tests.
- `npm run test:e2e`: Runs the end-to-end tests.

### Users (`users/package.json`)

- `npm start`: Starts the user service.
- `npm test`: Runs the tests for the service.

### Gamey (`gamey/Cargo.toml`)

- `cargo build`: Builds the gamey application.
- `cargo test`: Runs the unit tests.
- `cargo run`: Runs the gamey application.
- `cargo doc`: Generates documentation for the GameY engine application

## Estructura del proyecto

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
- `src/__tests__/`: Directorio que contiene los archivos de pruebas unitarias de webapp.
- `package.json`: Contiene los scripts necesarios para ejecutar, compilar y probar webapp.
- `vite.config.ts`: Archivo de configuración para Vite.
- `Dockerfile`: Archivo que define la imagen de Docker para webapp.
- `test/e2e/features/`: Archivos cucumber para la descripción de casos de pruebas de aceptación (e2e).
- `test/e2e/steps/`: Archivos JavaScript para la ejecución de pruebas de aceptación con Playwright.
- `test/e2e/support/`: Archivos de configuración del entorno de pruebas de aceptación.

### Users

`users` es una API implementada usando [Node.js](https://nodejs.org/) and [Express](https://expressjs.com/).

- `users-service.js`: Archivo principal de `users` desde donde se lanzará el módulo.
- `package.json`: Contiene los scripts necesarios para iniciar y probar el servicio.
- `Dockerfile`: Archivo que define la imagen de Docker para users.
- `__tests__/`: Directorio que contiene los archivos de pruebas unitarias de users.
- `config/`: Directorio que contiene los archivos de configuración de Express y Sequelize.
- `models/`: Directorio que contiene los archivos de definición de modelos para el ORM Sequelize.
- `openapi.yaml`: Archivo que contiene la especificación de la API del proyecto en el estándar OpenAPI.

### Gamey

`gamey` es el módulo del juego con soporte para bots hecho con [Rust](https://www.rust-lang.org/) y [Cargo](https://doc.rust-lang.org/cargo/).

- `src/main.rs`: Punto de entrada principal de la aplicación.
- `src/lib.rs`: Biblioteca del motor de juego.
- `src/bot/`: Registro e implementación de bots.
- `src/core/`: Lógica base del juego, incluyendo acciones, coordenadas, estado y gestión de jugadores.
- `src/notation/`: Notación del juego (YEN, YGN).
- `tests/`: Notación del juego (YEN, YGN).
- `Cargo.toml`: Dependencias y metadatos del módulo.
- `Dockerfile`: Archivo que define la imagen de Docker para gamey.

### database

`database` es el submódulo que contiene la información necesaria para arrancar la base de datos MySQL de `users`.

- `Dockerfile`: Archivo que define la imagen de MySQL para la base de datos.

