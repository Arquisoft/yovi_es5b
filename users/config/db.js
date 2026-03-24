import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME ?? "yovi-es5b-dev",
  process.env.DB_USER ?? "root",
  process.env.DB_PASSWORD ?? "ADMSIS123$",
  {
    host: "172.17.0.1", // dirección interna de host de docker
    dialect: 'mysql',
    logging: false
  }
);

export default sequelize;
