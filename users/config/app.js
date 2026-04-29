const express = require('express');
const session = require('express-session');
const promBundle = require('express-prom-bundle');
const app = express();
const port = 3000;

const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');

// Middleware de métricas
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Endpoint de Swagger
try {
  const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
  console.log(e);
}

// Cabeceras CORS
app.use((req, res, next) => {
  const origin = req.header('Origin') ?? req.header("Host");
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// Gestión de sesiones con express-session
app.use(session({
  name: "JSESSIONID",
  secret: "7HQ66YNzghTNzd9ZQUVB", 
  resave: false,                      // No reescribir sesiones sin cambios
  saveUninitialized: false,           // No guardar sesiones vacías
  cookie: { maxAge: 21600000, httpOnly: false }           // La sesión dura 6 horas
}));

// Autenticación mediante sesión de express-session
app.use((req, res, next) => {
    // Rutas a autenticar
    if (req.path.endsWith("/getuser")) {
        if (req.session.user && req.session.user.id_usuario) {
            next();
        } else {
            return res.sendStatus(403);
        }
    }  
  next();
});


app.use(express.json());

module.exports = {app, port}
