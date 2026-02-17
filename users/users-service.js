const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const { Sequelize, DataTypes } = require('sequelize');

const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

const sequelize = new Sequelize(process.env.DATABASE_URL || 'mysql://user:user_password@localhost:3306/yovi_db');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
});

sequelize.sync();

try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use(express.json());

app.post('/createuser', async (req, res) => {
  const { username, password } = req.body;
  try {
    const newUser = await User.create({ 
        username: username, 
        password: password 
    });

    res.json({ 
        message: `Hello ${newUser.username}! welcome to the course!`,
        userId: newUser.id 
    });
  } catch (err) {
    res.status(400).json({ error: "Error al crear el usuario en MySQL: " + err.message });
  }
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app;