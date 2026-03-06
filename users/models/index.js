const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

let Usuario, Robot, Jugador, Partida;

// En entorno de test, usamos objetos mockeables globales para que los tests puedan controlarlos fácilmente
if (process.env.NODE_ENV === 'test') {
  if (!global.mockModels) {
    global.mockModels = {
      Usuario: {
        findOne: async () => null,
        create: async () => ({}),
        findAll: async () => []
      },
      Robot: {},
      Jugador: {},
      Partida: {
        belongsTo: () => {}
      }
    };
  }
  Usuario = global.mockModels.Usuario;
  Robot = global.mockModels.Robot;
  Jugador = global.mockModels.Jugador;
  Partida = global.mockModels.Partida;
//en el resto de casos, usamos la conexión real a la base de datos
} else {
  Usuario = sequelize.define('Usuario', {
    id_usuario: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nombre: { type: DataTypes.STRING, allowNull: false },
    nom_usuario: { type: DataTypes.STRING, allowNull: false, unique: true },
    contrasena: { type: DataTypes.STRING, allowNull: false }
  }, { timestamps: false });

  Robot = sequelize.define('Robot', {
    id_robot: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    behaviour_type: { type: DataTypes.STRING, allowNull: false }
  }, { timestamps: false });

  Jugador = sequelize.define('Jugador', {
    id_player: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    behaviour_Type: { type: DataTypes.ENUM('usuario', 'robot'), allowNull: false },
    id_externo: { type: DataTypes.INTEGER, allowNull: false }
  }, { timestamps: false });

  Partida = sequelize.define('Partida', {
    id_partida: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    puntuacion: { type: DataTypes.INTEGER, defaultValue: 0 },
    turnos: { type: DataTypes.INTEGER, defaultValue: 0 }
  }, { timestamps: false });

  Partida.belongsTo(Jugador, { as: 'Jugador1', foreignKey: 'jugador1' });
  Partida.belongsTo(Jugador, { as: 'Jugador2', foreignKey: 'jugador2' });
}

module.exports = {
  sequelize,
  Usuario,
  Robot,
  Jugador,
  Partida
};
