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
  const username = req.body && req.body.username;
  try {
    // Simulate a 1 second delay to mimic processing/network latency
    await new Promise((resolve) => setTimeout(resolve, 1000));

    const message = `Hello ${username}! welcome to the course!`;
    res.json({ message });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// app.post('/createuser', async (req, res) => {
//   // 1. Extraemos los campos que espera nuestra tabla Usuario
//   const { nombre, nom_usuario, contrasena } = req.body;

//   try {
//     // 2. Validación básica para asegurarnos de que nos envían todo
//     if (!nombre || !nom_usuario || !contrasena) {
//       return res.status(400).json({ 
//         error: "Faltan datos. Por favor envía: nombre, nom_usuario y contrasena." 
//       });
//     }

//     // 3. Guardamos el usuario real en la base de datos MySQL
//     const nuevoUsuario = await Usuario.create({
//       nombre: nombre,
//       nom_usuario: nom_usuario,
//       contrasena: contrasena
//     });

//     // 4. Devolvemos una respuesta de éxito con los datos guardados
//     res.status(201).json({ 
//       message: `¡Usuario ${nom_usuario} creado con éxito!`,
//       usuario: nuevoUsuario
//     });
    
//   } catch (err) {
//     console.error('Error al guardar en la BD:', err);
//     // Si el nom_usuario ya existe, Sequelize lanzará un error que capturamos aquí
//     res.status(500).json({ error: err.message });
//   }
// });

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
