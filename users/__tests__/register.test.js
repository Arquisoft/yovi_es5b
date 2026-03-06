import { describe, it, expect, vi, beforeEach } from 'vitest'
import request from 'supertest'
import app from '../users-service.js'
import { Usuario } from '../models'

describe('Pruebas unitarias de registro', () => {
    
    beforeEach(() => {
        // Obtenemos el mock global para configurar las funciones de búsqueda y creación
        const mockUsuario = global.mockModels.Usuario
        // Reiniciamos los mocks de las funciones para cada test
        mockUsuario.findOne = vi.fn()
        mockUsuario.create = vi.fn()
    })

    it('debería registrar un usuario correctamente', async () => {
        // Simulamos que el nick no existe en la base de datos
        global.mockModels.Usuario.findOne.mockResolvedValue(null)
        // Simulamos que la creación del usuario devuelve el objeto creado
        global.mockModels.Usuario.create.mockResolvedValue({ id_usuario: 1, nombre: "Test", nom_usuario: "testuser" })

        // Realizamos la petición POST al endpoint de registro
        const res = await request(app)
            .post('/register')
            .send({ nombre: "Test", nom_usuario: "testuser", contrasena: "password123" })

        // Verificamos respuesta exitosa
        expect(res.status).toBe(200)
        // Verificamos que el JSON devuelto contiene el nick correcto
        expect(res.body.nom_usuario).toBe("testuser")
        // Verificamos que se llamó a la función de guardado en la BD
        expect(global.mockModels.Usuario.create).toHaveBeenCalled()
    })

    it('debería fallar si el nombre es demasiado corto (< 4 caracteres)', async () => {
        // Enviamos un nombre inválido de 3 caracteres
        const res = await request(app)
            .post('/register')
            .send({ nombre: "abc", nom_usuario: "user123", contrasena: "passwordSegura" })

        // Verificamos código de error 400
        expect(res.status).toBe(400)
        // Validamos el mensaje de error para el campo nombre
        expect(res.body.nombre).toBe("El nombre debe tener entre 4 y 30 caracteres.")
    })

    it('debería fallar si el nick ya está en uso', async () => {
        // Simulamos que la BD encuentra un usuario con ese nick
        global.mockModels.Usuario.findOne.mockResolvedValue({ nom_usuario: "repetido" })

        // Intentamos registrar un usuario con el nick duplicado
        const res = await request(app)
            .post('/register')
            .send({ nombre: "Nombre Valido", nom_usuario: "repetido", contrasena: "passwordSegura" })

        // Verificamos error por nick duplicado
        expect(res.status).toBe(400)
        // Validamos el mensaje de error específico
        expect(res.body.nom_usuario).toBe("El nick de usuario ya está en uso.")
    })

    it('debería fallar si la contraseña es corta', async () => {
        // Simulamos que el nick está libre
        global.mockModels.Usuario.findOne.mockResolvedValue(null)

        // Enviamos una contraseña de solo 3 caracteres
        const res = await request(app)
            .post('/register')
            .send({ nombre: "Nombre Valido", nom_usuario: "user123", contrasena: "123" })
        
        // Verificamos error por contraseña corta
        expect(res.status).toBe(400)
        // Validamos el mensaje de error de seguridad
        expect(res.body.contrasena).toBe("La contraseña debe tener al menos 8 caracteres.")
    })
})