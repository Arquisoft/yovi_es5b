const { Sequelize } = require('sequelize');


const sequelize = new Sequelize('users_db', 'yovi_user', 'yovi_pass', {
  host: 'mysqldb',
  dialect: 'mysql',
  logging: false,
});

module.exports = sequelize;