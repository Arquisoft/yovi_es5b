import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import {app} from '../users-service.js'
import { Usuario, sequelize } from '../models/index.js'

// Sustituimos el módulo de modelos por completo antes de importar la app
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

describe('Pruebas de Inicio de Sesión', () => {

    beforeEach(() => {
        // Limpiamos el historial de llamadas de las funciones mockeadas
        vi.clearAllMocks()
    })

    it('debería iniciar sesión con éxito si las credenciales son correctas', async () => {
        // Simulamos un usuario en BD con el hash correcto 
        const usuarioMock = {
            id_usuario: 1,
            nombre: "Test User",
            nom_usuario: "testuser",
            contrasena: "cf3bb5beba6c60a05e697521c59aa5303805e07da980e4807ae25fd92a8458ad$7e38627095a070b8df3d0af12b9857aa6a56a350e6eba7bf867a95800d25fc58" 
        }

        // Configuramos el mock para que devuelva este usuario
        vi.mocked(Usuario.findOne).mockReturnValue(usuarioMock);



        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "ADMSIS123$" })

        // Verificamos que el login es exitoso
        expect(res.status).toBe(200)
        expect(res.body.nom_usuario).toBe("testuser")
    })

    it('debería fallar si el nick no cumple la validación de longitud', async () => {
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "abc", contrasena: "password123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.nom_usuario).toBe("El nick debe tener entre 4 y 30 caracteres.")
    })

    it('debería fallar si la contraseña es demasiado corta', async () => {
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "123" })

        // Comprobamos que el validador detiene el proceso (400)
        expect(res.status).toBe(400)
        expect(res.body.contrasena).toBe("La contraseña debe tener al menos 8 caracteres.")
    })

    it('debería fallar si el usuario no existe en el sistema', async () => {
        // El mock devuelve null, simulando que el nick no está en la BD
        Usuario.findOne.mockResolvedValue(null)

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "nadie", contrasena: "password123" })

        expect(res.status).toBe(400)
        expect(res.body.error).toBe("Ocurrió un error al iniciar sesión.")
    })

    it('debería fallar si la contraseña es incorrecta', async () => {
        // Usuario con una contraseña que no coincidirá con la que enviamos
        Usuario.findOne.mockResolvedValue({
            nom_usuario: "testuser",
            contrasena: "sal$hashincorrecto"
        })

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "passwordErronea" })

        //Salta error (400)
        expect(res.status).toBe(400)
        expect(res.body.error).toBe("Error al iniciar sesión. Credenciales no válidas.")
    })
})
