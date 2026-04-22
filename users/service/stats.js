import { Partida, Usuario, sequelize } from '../models/index.js'

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

/**
 * Guarda una nueva partida en la base de datos.
 * 
 * @param {number} id_usuario - ID del usuario
 * @param {string} oponente - Nombre del bot/oponente
 * @param {boolean} ganada - true si el usuario ganó, false si perdió
 * @returns {Promise<object>} Partida creada
 * @throws Error si hay problemas al guardar en la base de datos
 */
const guardarPartida = async (id_usuario, oponente, ganada) => {
    try {
        const partida = await Partida.create({
            id_usuario: id_usuario,
            oponente: oponente,
            ganada: ganada
        });
        return partida;
    } catch (err) {
        console.error('Error al guardar partida:', err);
        throw err;
    }
}

/**
 * Obtiene el ranking global de todos los usuarios ordenado por partidas ganadas.
 * 
 * @returns {Promise<Array<{nom_usuario: string, nombre: string, jugadas: number, ganadas: number}>>}
 * @throws Error si hay problemas al acceder a la base de datos
 */
const obtenerRanking = async () => {
    try {
        const ranking = await Usuario.findAll({
            attributes: [
                'nom_usuario',
                'nombre',
                [sequelize.fn('COUNT', sequelize.col('Partidas.id_partida')), 'jugadas'], // Obtiene las partidas jugadas de cada usuario
                [sequelize.fn('SUM', sequelize.col('Partidas.ganada')), 'ganadas'], // Obtiene las partidas ganadas de cada usuario
            ],
            include: [{
                model: Partida,
                as: 'Partidas',
                attributes: []
            }],
            group: ['Usuario.id_usuario'], // Hace GROUPBY id_usuario
            order: [[sequelize.literal('ganadas'), 'DESC']], // Hace ORDERBY por partidas ganadas, de más a menos
            raw: true // Quita metadatos innecesarios de Sequelize
        });
        return ranking;
    } catch (err) {
        console.error('Error al obtener ranking:', err);
        throw err;
    }
}

export { obtenerPartidasJugadas, obtenerPartidasGanadas, obtenerPartidasPerdidas, guardarPartida, obtenerRanking }
