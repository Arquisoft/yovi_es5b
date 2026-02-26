const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    return sequelize.define('Usuario', {
        id_player: { type: DataTypes.INTEGER, primaryKey: true },
        nombre: { type: DataTypes.STRING(100), allowNull: false },
        nom_usuario: { type: DataTypes.STRING(50), unique: true, allowNull: false },
        contrasena: { type: DataTypes.STRING(255), allowNull: false }
    }, { tableName: 'Usuario', timestamps: false });
};