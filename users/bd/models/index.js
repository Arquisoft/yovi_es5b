const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DATABASE_URL || 'mysql://user:user_password@localhost:3306/yovi_db',
  {
    dialect: 'mysql',
    logging: false
  }
);

const Player = require('./player')(sequelize);
const Usuario = require('./usuario')(sequelize);
const Robot = require('./robot')(sequelize);
const Partida = require('./partida')(sequelize);

Player.hasOne(Usuario, { foreignKey: 'id_player' });
Usuario.belongsTo(Player, { foreignKey: 'id_player' });

Player.hasOne(Robot, { foreignKey: 'id_player' });
Robot.belongsTo(Player, { foreignKey: 'id_player' });

Partida.belongsTo(Player, { as: 'Jugador1', foreignKey: 'jugador1' });
Partida.belongsTo(Player, { as: 'Jugador2', foreignKey: 'jugador2' });

module.exports = {
    sequelize,
    Player,
    Usuario,
    Robot,
    Partida
};