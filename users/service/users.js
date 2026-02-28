const { Usuario } = require('../models');
const { scrypt } = require('@noble/hashes/scrypt.js');
const { bytesToHex, randomBytes } = require('@noble/hashes/utils.js');

/**
 * Registra a un usuario en el sistema. Los datos del usuario ya deberían haberse validado previamente.
 *
 * Devuelve el nuevo usuario creado o lanza un error si ocurre algún problema al crear el usuario.
 */
const registrarUsuario = async (nombre, nom_usuario, contrasena) => {
    try {
        const secretoScrypt = cifrar_contraseña(contrasena);
        const nuevoUsuario = await Usuario.create({
            nombre: nombre,
            nom_usuario: nom_usuario,
            contrasena: secretoScrypt.sal + "$" + secretoScrypt.contraseña
        });

        return { id_usuario: nuevoUsuario.id_usuario, nombre: nuevoUsuario.nombre, nom_usuario: nuevoUsuario.nom_usuario };

    } catch (err) {
        console.error('Error al crear usuario', err);
        throw err;
    }
}

/**
 * Inicia la sesión de un usuario. Los datos del usuario ya deberían haberse validado previamente.
 *
 * Devuelve el usuario autenticado o lanza un error si ocurre algún problema al crear el usuario.
 */
const iniciarSesion = async (nom_usuario, contrasena) => {
    try {
        const usuarioExistente = await Usuario.findOne({
            attributes: ["id_usuario", "nom_usuario", "nombre", "contrasena"],
            where: {
                nom_usuario: nom_usuario,
            },
        });

        // Comprobar credenciales: 0:sal 1:contraseña
        const secretoScrypt = usuarioExistente.contrasena.split("$");
        const contraseñaCifrada = cifrar_contraseña(contrasena, secretoScrypt[0]).contraseña;
        if (contraseñaCifrada === secretoScrypt[1]) {
            return { id_usuario: usuarioExistente.id_usuario, nombre: usuarioExistente.nombre, nom_usuario: usuarioExistente.nom_usuario };
        }

        return null;

    } catch (err) {
        console.error('Error al buscar usuario', err);
        throw err;
    }
}

// Ver parámetros de cifrado: https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html#scrypt
const cifrar_contraseña = (contraseña, sal = null) => {
    const salContraseña = sal === null ? bytesToHex(randomBytes(32)) : sal;
    const contraseñaCifrada = scrypt(contraseña, salContraseña, { N: 2 ** 18, r: 8, p: 1, dkLen: 32 });
    return { contraseña: bytesToHex(contraseñaCifrada), sal: salContraseña };
};


module.exports = { registrarUsuario, iniciarSesion }
