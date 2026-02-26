const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Partida', {
        id_partida: { 
            type: DataTypes.INTEGER, 
            primaryKey: true, 
            autoIncrement: true 
        },
        puntuacion: { 
            type: DataTypes.INTEGER, 
            defaultValue: 0 
        },
        turnos: { 
            type: DataTypes.INTEGER, 
            defaultValue: 0 
        },
        // Nota: Los campos 'jugador1' y 'jugador2' no se definen aquí manualmente
        // porque se crean automáticamente al definir las relaciones en index.js
    }, { 
        tableName: 'Partida', 
        timestamps: false 
    });
};