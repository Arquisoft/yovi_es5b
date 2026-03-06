import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../users-service.js'
import { Usuario } from '../models'
import { cifrar_contraseña } from '../service/users.js'

describe('Pruebas de Inicio de Sesión', () => {

    beforeEach(() => {
        // Obtenemos la referencia al modelo trucado para resetearlo antes de cada test
        const mockUsuario = global.mockModels.Usuario
        // Limpiamos las funciones para que no arrastren datos de tests anteriores
        mockUsuario.findOne = vi.fn()
        mockUsuario.create = vi.fn()
    })

    it('debería iniciar sesión con éxito si las credenciales son correctas', async () => {
        const password = "password123"
        const salt = "123"
        // Calculamos el hash real usando para que la comparación sea válida
        const hash = cifrar_contraseña(password, salt).contraseña

        // Creamos un usuario ficticio
        const usuarioMock = {
            id_usuario: 1,
            nombre: "Test User",
            nom_usuario: "testuser",
            contrasena: `${salt}$${hash}`
        }

        // Forzamos al mock a devolver nuestro usuario cuando se busque en la BD
        global.mockModels.Usuario.findOne.mockResolvedValue(usuarioMock)

        // Lanzamos la petición de login al servidor Express
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: password })

        // Verificamos que el servidor responde con un éxito 200
        expect(res.status).toBe(200)
        // Comprobamos que en el cuerpo viene el nombre de usuario correcto
        expect(res.body.nom_usuario).toBe("testuser")
    })

    it('debería fallar si el nick no cumple la validación de longitud', async () => {
        // Enviamos un nick demasiado corto para disparar el validador
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "abc", contrasena: "password123" })

        // El servidor debe responder 400 por error de validación
        expect(res.status).toBe(400)
        // Verificamos que el mensaje de error es el que definimos en el validador
        expect(res.body.nom_usuario).toBe("El nick debe tener entre 4 y 30 caracteres.")
    })

    it('debería fallar si la contraseña es demasiado corta', async () => {
        // Enviamos una contraseña de solo 3 caracteres
        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "123" })

        // Comprobamos que el código de estado es 400
        expect(res.status).toBe(400)
        // Validamos el mensaje de error específico para la contraseña
        expect(res.body.contrasena).toBe("La contraseña debe tener al menos 8 caracteres.")
    })

    it('debería fallar si el usuario no existe en el sistema', async () => {
        // Simulamos que la base de datos no encuentra a nadie con ese nick
        global.mockModels.Usuario.findOne.mockResolvedValue(null)

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "nadie", contrasena: "password123" })

        // El sistema debe rechazar la entrada con un error 400
        expect(res.status).toBe(400)
    })

    it('debería fallar si la contraseña es incorrecta', async () => {
        // Simulamos que encontramos al usuario pero con una contraseña distinta
        global.mockModels.Usuario.findOne.mockResolvedValue({
            nom_usuario: "testuser",
            contrasena: "sal$hashincorrecto"
        })

        const res = await request(app)
            .post('/login')
            .send({ nom_usuario: "testuser", contrasena: "passwordErronea" })

        // Verificamos que el login falla por credenciales inválidas
        expect(res.status).toBe(400)
        // Comprobamos que el objeto de respuesta contiene una propiedad de error
        expect(res.body.error).toBeDefined()
    })
})