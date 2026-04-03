import { Partida } from '../models/index.js'

/**
 * Obtiene el número total de partidas jugadas por un usuario.
 * 
 * @param {number} id_usuario - ID del usuario
 * @returns {Promise<number>} Número total de partidas jugadas
 * @throws Error si hay problemas al acceder a la base de datos
 */
const obtenerPartidasJugadas = async (id_usuario) => {
    try {
        const count = await Partida.count({
            where: {
                id_usuario: id_usuario
            }
        });
        return count;
    } catch (err) {
        console.error('Error al obtener partidas jugadas:', err);
        throw err;
    }
}

/**
 * Obtiene el número de partidas ganadas por un usuario.
 * 
 * @param {number} id_usuario - ID del usuario
 * @returns {Promise<number>} Número de partidas ganadas
 * @throws Error si hay problemas al acceder a la base de datos
 */
const obtenerPartidasGanadas = async (id_usuario) => {
    try {
        const count = await Partida.count({
            where: {
                id_usuario: id_usuario,
                ganada: true
            }
        });
        return count;
    } catch (err) {
        console.error('Error al obtener partidas ganadas:', err);
        throw err;
    }
}

/**
 * Obtiene el número de partidas perdidas por un usuario.
 * 
 * @param {number} id_usuario - ID del usuario
 * @returns {Promise<number>} Número de partidas perdidas
 * @throws Error si hay problemas al acceder a la base de datos
 */
const obtenerPartidasPerdidas = async (id_usuario) => {
    try {
        const count = await Partida.count({
            where: {
                id_usuario: id_usuario,
                ganada: false
            }
        });
        return count;
    } catch (err) {
        console.error('Error al obtener partidas perdidas:', err);
        throw err;
    }
}

export { obtenerPartidasJugadas, obtenerPartidasGanadas, obtenerPartidasPerdidas }
