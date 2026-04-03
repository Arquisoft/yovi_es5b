import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Usuario = sequelize.define('Usuario', {
  id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  nom_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
  contrasena: { type: DataTypes.STRING, allowNull: false }
}, { timestamps: false });

const Partida = sequelize.define('Partida', {
  id_partida: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  id_usuario: { type: DataTypes.INTEGER, allowNull: false },
  oponente: { type: DataTypes.STRING, allowNull: false },
  ganada: { type: DataTypes.BOOLEAN, allowNull: false } // true si el usuario ganó, false si perdió
}, { timestamps: false });

// Un Usuario tiene muchas Partidas
Usuario.hasMany(Partida, { as: 'Partidas', foreignKey: 'id_usuario' });

// Una Partida pertenece a un Usuario
Partida.belongsTo(Usuario, { as: 'Usuario', foreignKey: 'id_usuario' });

export  {
  sequelize,
  Usuario,
  Partida
};
