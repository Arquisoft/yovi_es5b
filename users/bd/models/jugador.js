const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Jugador', {
        id_jugador: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
        type: { type: DataTypes.ENUM('usuario', 'robot'), allowNull: false }
    }, { tableName: 'Jugadores', timestamps: false });
};