const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  nom_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false }
}, { timestamps: false });

const Robot = sequelize.define('Robot', {
  id_robot: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  behaviour_type: { type: DataTypes.STRING, allowNull: false }
}, { timestamps: false });

const Jugador = sequelize.define('Jugador', {
  id_player: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  behaviour_Type: { type: DataTypes.ENUM('usuario', 'robot'), allowNull: false },
  id_externo: { type: DataTypes.INTEGER, allowNull: false }
}, { timestamps: false });

const Partida = sequelize.define('Partida', {
  id_partida: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  puntuacion: { type: DataTypes.INTEGER, defaultValue: 0 },
  turnos: { type: DataTypes.INTEGER, defaultValue: 0 }
}, { timestamps: false });

Partida.belongsTo(Jugador, { as: 'Jugador1', foreignKey: 'jugador1' });
Partida.belongsTo(Jugador, { as: 'Jugador2', foreignKey: 'jugador2' });

module.exports = {
  sequelize,
  Usuario,
  Robot,
  Jugador,
  Partida
};