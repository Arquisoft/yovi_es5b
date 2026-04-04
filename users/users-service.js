import { app, port } from "./config/app.js";
import { sequelize, Usuario } from './models/index.js';
import { registrarUsuario, iniciarSesion } from "./service/users.js";
import { validarRegistrarUsuario, validarIniciarSesion } from"./validator/user-validators.js";
import { obtenerPartidasJugadas, obtenerPartidasGanadas, obtenerPartidasPerdidas, guardarPartida } from "./service/stats.js";

/**
 * Ruta para obtener información sobre el usuario actual.
 * Devuelve:
 * - 200: información del usuario activo
 * - 403: error si no hay usuario autenticado
 **/
app.get(['/getuser', '/bot/getuser'], async (req, res) => {
    res.status(200).json(req.session.user);
});

/**
 * Ruta de registro. Requiere:
 * - nombre
 * - nom_usuario
 * - contrasena
 *
 * Devuelve:
 * - 200: usuario registrado
 * - 400: objecto con errores del registro
 **/
app.post(['/register', '/bot/register'], async (req, res) => {
    const errores = await validarRegistrarUsuario(req?.body?.nombre, req?.body?.nom_usuario, req?.body?.contrasena);
    if (Object.keys(errores).length > 0) {
        res.status(400).json(errores);
        return;
    }

    try {
        const nuevoUsuario = await registrarUsuario(req.body.nombre, req.body.nom_usuario, req.body.contrasena);
        req.session.user = { id_usuario: nuevoUsuario.id_usuario, nombre: nuevoUsuario.nombre, username: nuevoUsuario.nom_usuario };
        res.status(200).json(nuevoUsuario);
    } catch (err) {
        res.status(400).json({ error: "Ocurrió un error al registrar al usuario." });
    }
});

/**
 * Ruta de inicion de sesión. Requiere:
 * - nom_usuario
 * - contrasena
 *
 * Devuelve:
 * - 200: usuario con el que se inicia sesión
 * - 400: objecto con información de error
 **/
app.post(['/login', '/bot/login'], async (req, res) => {
    const errores = await validarIniciarSesion(req?.body?.nom_usuario, req?.body?.contrasena);
    if (Object.keys(errores).length > 0) {
        res.status(400).json(errores);
        return;
    }

    try {
        const usuario = await iniciarSesion(req.body.nom_usuario, req.body.contrasena);
        // Autenticación fallida
        if (usuario == null) {
            res.status(400).json({ error: "Error al iniciar sesión. Credenciales no válidas." });
            return;
        }

        // Establecer sesión
        req.session.user = { id_usuario: usuario.id_usuario, nombre: usuario.nombre, username: usuario.nom_usuario };
        res.status(200).json(usuario);
    } catch (err) {
        res.status(400).json({ error: "Ocurrió un error al iniciar sesión." });
    }
});

/**
 * Ruta para obtener las estadísticas completas del usuario especificado en la ruta.
 * Se requiere autenticación para ver las estadísticas de cualquier usuario.
 * Cualquier usuario puede ver las estadísticas de los demás usuarios.
 * 
 * Devuelve:
 * - 200: objeto con partidas jugadas, ganadas y perdidas
 * - 403: error si no hay usuario autenticado
 * - 404: error si el usuario no existe
 * - 500: error al obtener estadísticas
**/
app.get('/stats/:nom_usuario', async (req, res) => {
    if (!req.session.user) {
        res.status(403).json({ error: "No hay usuario autenticado." });
        return;
    }

    try {
        const usuario = await Usuario.findOne({ where: { nom_usuario: req.params.nom_usuario } });
        if (!usuario) {
            res.status(404).json({ error: "Usuario no encontrado." });
            return;
        }
        
        const jugadas = await obtenerPartidasJugadas(usuario.id_usuario);
        const ganadas = await obtenerPartidasGanadas(usuario.id_usuario);
        const perdidas = await obtenerPartidasPerdidas(usuario.id_usuario);
        
        res.status(200).json({ jugadas, ganadas, perdidas });
    } catch (err) {
        res.status(500).json({ error: "Error al obtener estadísticas." });
    }
});

/**
 * Ruta para guardar una partida finalizada.
 * Requiere autenticación.
 * 
 * Body:
 * - oponente: nombre del bot/oponente
 * - ganada: boolean indicando si el usuario ganó
 * 
 * Devuelve:
 * - 200: partida guardada exitosamente
 * - 400: error si faltan parámetros
 * - 403: error si no hay usuario autenticado
 * - 500: error al guardar la partida
**/
app.post('/guardar-partida', async (req, res) => {
    if (!req.session.user) {
        res.status(403).json({ error: "No hay usuario autenticado." });
        return;
    }

    const { oponente, ganada } = req.body;

    if (!oponente || ganada === undefined || ganada === null) {
        res.status(400).json({ error: "Faltan parámetros: oponente y ganada son requeridos." });
        return;
    }

    try {
        const partida = await guardarPartida(req.session.user.id_usuario, oponente, ganada);
        res.status(200).json({ message: "Partida guardada correctamente.", partida });
    } catch (err) {
        res.status(500).json({ error: "Error al guardar la partida." });
    }
});

const conectarDB = async () => {
    let retries = 20;
    while (retries > 0) {
        try {
            await sequelize.authenticate();
            console.log('Conexión a MySQL establecida correctamente.');

            // Sincroniza las tablas (force: true las recrea de forma forzosa)
            await sequelize.sync({ force: true });
            console.log('Tablas de YOVI listas.');

            break;
        } catch (err) {
            console.error(`Error al conectar con MySQL. Reintentos restantes: ${retries - 1}`, err);
            retries -= 1;

            if (retries === 0) {
                console.error('No se pudo conectar a la base de datos tras varios intentos:', err);
            } else {
                console.log('⏳ Esperando 1 segundo antes de reintentar...');
                await new Promise(res => setTimeout(res, 1000));
            }
        }
    }
};

// Método "main" de la aplicación express:
// 1. Se conecta a la base de datos
// 2. Lanza la aplicación express para escuchar en el puerto especificado.
    conectarDB().catch((err) => console.error(err));
    app.listen(port, () => {
        console.log(`User Service listening at http://localhost:${port}`)
    })

export {app}
