const express = require('express');
const app = express();
const port = 3000;
const swaggerUi = require('swagger-ui-express');
const fs = require('node:fs');
const YAML = require('js-yaml');
const promBundle = require('express-prom-bundle');
const { Sequelize, DataTypes } = require('sequelize');

// Middleware de métricas
const metricsMiddleware = promBundle({includeMethod: true});
app.use(metricsMiddleware);

// Configuración de Sequelize con variables de entorno
const sequelize = new Sequelize(process.env.DATABASE_URL || 'mysql://yovi_user:yovi_pass@mysqldb:3306/users_db', {
    dialect: 'mysql',
    logging: false, // Evita saturar la consola con logs de SQL
});

// Definición del modelo de Usuario
const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
});

// Carga de Swagger (OpenAPI)
try {
    const swaggerDocument = YAML.load(fs.readFileSync('./openapi.yaml', 'utf8'));
    app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
} catch (e) {
    console.log("No se pudo cargar el archivo openapi.yaml:", e.message);
}

// Configuración de CORS y JSON
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
});
app.use(express.json());

// --- ENDPOINTS ---

// Health check para que Docker sepa que el servicio está vivo
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', time: new Date().toISOString() });
});

// Registro de usuario
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
        res.status(400).json({ error: "El usuario ya existe o los datos son inválidos" });
    }
});

// Login de usuario (comparación simple)
app.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const user = await User.findOne({ where: { username } });
        if (user && user.password === password) {
            res.json({ success: true, message: "Login correcto", username: user.username });
        } else {
            res.status(401).json({ error: "Usuario o contraseña incorrectos" });
        }
    } catch (err) {
        res.status(500).json({ error: "Error interno en el servidor" });
    }
});

// --- FUNCIÓN DE ARRANQUE CON REINTENTOS ---
// Esto soluciona el error EAI_AGAIN esperando a que la DB esté lista
async function startServer() {
    let connected = false;
    let attempts = 0;
    const maxAttempts = 10;

    console.log("Iniciando conexión con la base de datos...");

    while (!connected && attempts < maxAttempts) {
        try {
            await sequelize.authenticate();
            // sync() crea las tablas si no existen
            await sequelize.sync();
            console.log('Conexión a MySQL establecida correctamente.');
            connected = true;
        } catch (err) {
            attempts++;
            console.log(`[Intento ${attempts}] Error conectando a mysqldb. Reintentando en 5s...`);
            // Esperamos 5 segundos antes de volver a intentar
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    if (connected) {
        app.listen(port, () => {
            console.log(`User Service listening at http://localhost:${port}`);
        });
    } else {
        console.error('FATAL: No se pudo conectar a MySQL tras varios intentos. Cerrando servicio.');
        process.exit(1);
    }
}

// Ejecutar el arranque si no es un test
if (require.main === module) {
    startServer();
}

module.exports = app;