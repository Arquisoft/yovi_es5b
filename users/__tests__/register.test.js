import { describe, it, expect, vi, beforeEach } from 'vitest'
import {app} from '../users-service.js'
import { Usuario, sequelize } from '../models/index.js'
import request from 'supertest'

// Sustituimos el módulo de modelos por completo antes de importar la app
vi.mock('../models/index.js', () => ({
    Usuario: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn()
    },
    // Mockeamos sequelize para que no intente conectar a una DB real al arrancar
    sequelize: {
        authenticate: vi.fn().mockResolvedValue(0),
        sync: vi.fn().mockResolvedValue(0)
    }
}))
vi.mock('../models/index.js', () => ({
    Usuario: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn()
    },
    // Mockeamos sequelize para que no intente conectar a una DB real al arrancar
    sequelize: {
        authenticate: vi.fn().mockResolvedValue(),
        sync: vi.fn().mockResolvedValue()
    }
}))

// Importamos la app y el modelo mockeado

describe('Pruebas unitarias de registro', () => {

    beforeEach(() => {
        // Limpiamos el historial de llamadas de las funciones mockeadas
        vi.clearAllMocks()
    })

    it('debería registrar un usuario correctamente', async () => {
        // Configuramos el comportamiento del mock para este test
        Usuario.findOne.mockResolvedValue(null)
        Usuario.create.mockResolvedValue({ id_usuario: 1, nombre: "Test", nom_usuario: "testuser" })

        const res = await request(app)
            .post('/register')
            .send({ nombre: "Test", nom_usuario: "testuser", contrasena: "password123" })

        // Verificamos que el servidor responde con éxito (200)
        expect(res.status).toBe(200)
        // Comprobamos que el cuerpo de la respuesta es el objeto que definimos en el mock
        expect(res.body.nom_usuario).toBe("testuser")
        // Verificamos que se llamó a la función de creación del mock
        expect(Usuario.create).toHaveBeenCalled()
    })

    it('debería fallar si el nombre es demasiado corto (< 4 caracteres)', async () => {
        const res = await request(app)
            .post('/register')
            .send({ nombre: "abc", nom_usuario: "user123", contrasena: "passwordSegura" })

        // Verificamos el error de validación (400)
        expect(res.status).toBe(400)
        expect(res.body.nombre).toBe("El nombre debe tener entre 4 y 30 caracteres.")
    })

    it('debería fallar si el nick ya está en uso', async () => {
        // Forzamos al mock a decir que el usuario ya existe
        Usuario.findOne.mockResolvedValue({ nom_usuario: "repetido" })

        const res = await request(app)
            .post('/register')
            .send({ nombre: "Nombre Valido", nom_usuario: "repetido", contrasena: "passwordSegura" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.nom_usuario).toBe("El nick de usuario ya está en uso.")
    })

    it('debería fallar si la contraseña es corta', async () => {
        Usuario.findOne.mockResolvedValue(null)

        const res = await request(app)
            .post('/register')
            .send({ nombre: "Nombre Valido", nom_usuario: "user123", contrasena: "123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.contrasena).toBe("La contraseña debe tener al menos 8 caracteres.")
    })
})
