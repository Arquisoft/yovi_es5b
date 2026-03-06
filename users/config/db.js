const { Sequelize } = require('sequelize');

let sequelize;

// En entorno de test, usamos un mock de sequelize para evitar errores de conexión y dependencias externas (sqlite3)
if (process.env.NODE_ENV === 'test') {
  sequelize = {
    authenticate: async () => Promise.resolve(),
    sync: async () => Promise.resolve(),
    define: () => ({
      findOne: async () => Promise.resolve(null),
      create: async () => Promise.resolve({}),
      belongsTo: () => {},
      findAll: async () => Promise.resolve([])
    })
  };
// En entorno de desarrollo y producción, usamos la conexión real a la base de datos
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD,
    {
      host: process.env.DB_HOST,
      dialect: 'mysql',
      logging: false
    }
  );
}

module.exports = sequelize;
