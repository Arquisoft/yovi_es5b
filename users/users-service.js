const { app, port } = require("./config/app.js");
const { sequelize, Usuario } = require('./models');
const { registrarUsuario, iniciarSesion } = require("./service/users.js");
const { validarRegistrarUsuario, validarIniciarSesion } = require("./validator/user-validators.js");

/**
 * Ruta para obtener información sobre el usuario actual.
 * Devuelve:
 * - 200: información del usuario activo
 * - 403: error si no hay usuario autenticado
 **/
app.get('/getuser', async (req, res) => {
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
app.post('/register', async (req, res) => {
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
app.post('/login', async (req, res) => {
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
        }

        // Establecer sesión
        req.session.user = { id_usuario: usuario.id_usuario, nombre: usuario.nombre, username: usuario.nom_usuario };
        res.status(200).json(usuario);
    } catch (err) {
        res.status(400).json({ error: "Ocurrió un error al iniciar sesión." });
    }
});



const conectarDB = async () => {
    let retries = 20;
    while (retries > 0) {
        try {
            await sequelize.authenticate();
            console.log('✅ Conexión a MySQL establecida correctamente.');

            // Sincroniza las tablas (force: true las recrea de forma forzosa)
            await sequelize.sync({ force: true });
            console.log('✅ Tablas de YOVI listas.');

            break;
        } catch (err) {
            console.error(`❌ Error al conectar con MySQL. Reintentos restantes: ${retries - 1}`, err);
            retries -= 1;

            if (retries === 0) {
                console.error('❌ No se pudo conectar a la base de datos tras varios intentos:', err);
            } else {
                console.log('⏳ Esperando 3 segundos antes de reintentar...');
                await new Promise(res => setTimeout(res, 3000));
            }
        }
    }
};

// Método "main" de la aplicación express:
// 1. Se conecta a la base de datos
// 2. Lanza la aplicación express para escuchar en el puerto especificado.
if (require.main == module) {
    conectarDB().catch((err) => console.error(err));
    app.listen(port, () => {
        console.log(`User Service listening at http://localhost:${port}`)
    })
}

module.exports = app
