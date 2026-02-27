const { Usuario } = require('../models');
/**
 * Validor de registrarUsuario. Comprueba:
 * - Nombre del usuario de al menos 4 caracteres y máximo 30.
 * - Nick de usuario de al menos 4 caracteres y máximo 20.
 * - Contraseña del usuario de al menos 8 caracteres.
 * - Usuario no existe ya con ese nick asociado.
 *
 * Devuelve un objeto donde cada clave es el nombre de un campo y su valor son los errores asociados a este.
 **/
const validarRegistrarUsuario = async (nombre, nom_usuario, contrasena) => {
    const errores = {};
    if (typeof nombre !== "string" || nombre.trim().length < 4 || nombre.trim().length > 30) {
        errores.nombre = "El nombre debe tener entre 4 y 30 caracteres.";
    }

    if (typeof nom_usuario !== "string" || nom_usuario.trim().length < 4 || nom_usuario.trim().length > 30) {
        errores.nom_usuario = "El nick debe tener entre 4 y 30 caracteres.";

    } else {
        const usuarioExistente = await Usuario.findOne({
            attributes: ["nom_usuario"],
            where: {
                nom_usuario: nom_usuario,
            },
        });

        if (usuarioExistente !== null) {
            errores.nom_usuario = "El nick de usuario ya está en uso.";
        }
    }

    if (typeof contrasena !== "string" || contrasena.length < 8) {
        errores.contrasena = "La contraseña debe tener al menos 8 caracteres.";
    }

    return errores;
}

/**
 * Validor de iniciarSesion. Comprueba:
 * - Nick de usuario de al menos 4 caracteres y máximo 20.
 * - Contraseña del usuario de al menos 8 caracteres.
 *
 * Devuelve un objeto donde cada clave es el nombre de un campo y su valor son los errores asociados a este.
 **/
const validarIniciarSesion = async (nom_usuario, contrasena) => {
    const errores = {};

    if (typeof nom_usuario !== "string" || nom_usuario.trim().length < 4 || nom_usuario.trim().length > 30) {
        errores.nom_usuario = "El nick debe tener entre 4 y 30 caracteres.";

    }

    if (typeof contrasena !== "string" || contrasena.length < 8) {
        errores.contrasena = "La contraseña debe tener al menos 8 caracteres.";
    }

    return errores;
}

module.exports = { validarRegistrarUsuario, validarIniciarSesion }
