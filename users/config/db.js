import { Sequelize } from 'sequelize';

const sequelize = new Sequelize(
  process.env.DB_NAME ?? "yovi-es5b-dev",
  process.env.DB_USER ?? "root",
  process.env.DB_PASSWORD ?? "ADMSIS123$",
  {
    //Azure:172.17.0.1      Local:127.0.0.1
    host: "127.0.0.1", 
    dialect: 'mysql',
    logging: false
  }
);

export default sequelize;
