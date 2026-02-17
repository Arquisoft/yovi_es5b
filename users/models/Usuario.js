    const { DataTypes } = require('sequelize');
const sequelize = require('../database');

const User = sequelize.define('Usuario', {
  Nombre: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  Contrasenia: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

module.exports = User;