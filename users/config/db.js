const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME ?? "yovi-es5b-dev",
  process.env.DB_USER ?? "root",
  process.env.DB_PASSWORD ?? "ADMSIS123$",
  {
    host: process.env.DB_HOST, // Esto ahora valdrá 'mysql-db' gracias a Docker
    dialect: 'mysql',
    logging: false
  }
);

module.exports = sequelize;
