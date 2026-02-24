const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const { sequelize, Usuario } = require('./models');

const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

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
  // 1. Extraemos los nombres exactos que envías desde Swagger
  const { nombre, nom_usuario, contrasena } = req.body;

  try {
    // 2. Intentamos guardar en la base de datos real
    const nuevoUsuario = await Usuario.create({
      nombre: nombre,
      nom_usuario: nom_usuario,
      contrasena: contrasena
    });

    // 3. Si funciona, devolvemos el nombre real guardado y el ID de la BD
    res.status(201).json({ 
      message: `¡Usuario ${nuevoUsuario.nom_usuario} creado con éxito!`,
      userId: nuevoUsuario.id_usuario 
    });
    
  } catch (err) {
    console.error('Error en la base de datos:', err.message);
    // Si el usuario ya existe, Sequelize saltará aquí
    res.status(400).json({ error: "No se pudo crear el usuario (quizás ya existe)" });
  }
});

// Ruta para obtener todos los usuarios (para probar que se guardan)
app.get('/getusers', async (req, res) => {
  try {
    const usuarios = await Usuario.findAll({
      attributes: ['id_usuario', 'nombre', 'nom_usuario'] // No enviamos la contraseña por seguridad
    });
    res.json(usuarios);
  } catch (err) {
    res.status(500).json({ error: "Error al obtener los usuarios" });
  }
});

const conectarDB = async () => {
  let retries = 20;
  while (retries > 0) {
    try {
      await sequelize.authenticate();
      console.log('✅ Conexión a MySQL establecida correctamente.');
      
      // Sincroniza las tablas ({ alter: true } actualiza columnas sin borrar datos)
      await sequelize.sync({ alter: true });
      console.log('✅ Tablas de YOVI listas.');
      
      // Si todo va bien, salimos del bucle
      break; 
    } catch (err) {
      console.error(`❌ Error al conectar con MySQL. Reintentos restantes: ${retries - 1}`);
      retries -= 1;
      
      if (retries === 0) {
        console.error('❌ No se pudo conectar a la base de datos tras varios intentos:', err);
      } else {
        console.log('⏳ Esperando 3 segundos antes de reintentar...');
        await new Promise(res => setTimeout(res, 3000));
      }
    }
  }
};

conectarDB();


if (require.main === module) {
  app.listen(port, () => {
    console.log(`User Service listening at http://localhost:${port}`)
  })
}

module.exports = app
