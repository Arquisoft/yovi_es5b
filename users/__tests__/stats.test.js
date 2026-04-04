import { describe, it, expect, vi, beforeEach } from 'vitest'
import { obtenerPartidasJugadas, obtenerPartidasGanadas, obtenerPartidasPerdidas, guardarPartida } from '../service/stats.js'
import { Partida, Usuario } from '../models/index.js'
import request from 'supertest'
import { app } from '../users-service.js'

// Mock del modelo Partida y Usuario
vi.mock('../models/index.js', () => ({
    Partida: {
        count: vi.fn(),
        create: vi.fn()
    },
    Usuario: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn()
    },
    sequelize: {
        authenticate: vi.fn().mockResolvedValue(),
        sync: vi.fn().mockResolvedValue()
    }
}))

describe('Pruebas unitarias de Estadísticas', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })
    
    describe('Obtener partidas jugadas', () => {
        it('debería devolver el total correcto de partidas jugadas', async () => {
            Partida.count.mockResolvedValue(15)

            const resultado = await obtenerPartidasJugadas(1)

            expect(resultado).toBe(15)
        })

        it('debería devolver 0 cuando el usuario no tiene partidas', async () => {
            Partida.count.mockResolvedValue(0)

            const resultado = await obtenerPartidasJugadas(5)

            expect(resultado).toBe(0)
        })

        it('debería llamar a Partida.count con el id_usuario correcto', async () => {
            Partida.count.mockResolvedValue(10)

            await obtenerPartidasJugadas(42)

            expect(Partida.count).toHaveBeenCalledWith({
                where: { id_usuario: 42 }
            })
        })

        it('debería hacer la consulta filtrando únicamente por "id_usuario"', async () => {
            Partida.count.mockResolvedValue(20)

            await obtenerPartidasJugadas(1)

            // El where SOLO debe tener id_usuario
            const callArgs = Partida.count.mock.calls[0][0]
            expect(callArgs.where).toHaveProperty('id_usuario')
            expect(callArgs.where).not.toHaveProperty('ganada')
            expect(callArgs.where).not.toHaveProperty('oponente')
        })

        it('debería soportar números grandes de partidas', async () => {
            Partida.count.mockResolvedValue(1000000)

            const resultado = await obtenerPartidasJugadas(1)

            expect(resultado).toBe(1000000)
        })

        it('debería lanzar error cuando falla la BD', async () => {
            const error = new Error("Database connection failed")
            Partida.count.mockRejectedValue(error)

            await expect(obtenerPartidasJugadas(1)).rejects.toThrow("Database connection failed")
        })
    })

    describe('Obtener partidas ganadas', () => {
        it('debería devolver el total correcto de partidas ganadas', async () => {
            Partida.count.mockResolvedValue(8)

            const resultado = await obtenerPartidasGanadas(1)

            expect(resultado).toBe(8)
        })

        it('debería devolver 0 cuando el usuario no ha ganado partidas', async () => {
            Partida.count.mockResolvedValue(0)

            const resultado = await obtenerPartidasGanadas(3)

            expect(resultado).toBe(0)
        })

        it('debería usar el filtro "ganada: true"', async () => {
            Partida.count.mockResolvedValue(5)

            await obtenerPartidasGanadas(7)

            expect(Partida.count).toHaveBeenCalledWith({
                where: {
                    id_usuario: 7,
                    ganada: true
                }
            })
        })

        it('debería llamar a Partida.count con el id_usuario correcto', async () => {
            Partida.count.mockResolvedValue(3)

            await obtenerPartidasGanadas(99)

            const callArgs = Partida.count.mock.calls[0][0]
            expect(callArgs.where.id_usuario).toBe(99)
        })

        it('debería manejar error de conexión a BD', async () => {
            const error = new Error("Connection timeout")
            Partida.count.mockRejectedValue(error)

            await expect(obtenerPartidasGanadas(1)).rejects.toThrow("Connection timeout")
        })
    })

    describe('Obtener partidas perdidas', () => {
        it('debería devolver el total correcto de partidas perdidas', async () => {
            Partida.count.mockResolvedValue(4)

            const resultado = await obtenerPartidasPerdidas(2)

            expect(resultado).toBe(4)
        })

        it('debería devolver 0 cuando el usuario no ha perdido partidas', async () => {
            Partida.count.mockResolvedValue(0)

            const resultado = await obtenerPartidasPerdidas(10)

            expect(resultado).toBe(0)
        })

        it('debería usar el filtro "ganada: false"', async () => {
            Partida.count.mockResolvedValue(2)

            await obtenerPartidasPerdidas(5)

            expect(Partida.count).toHaveBeenCalledWith({
                where: {
                    id_usuario: 5,
                    ganada: false
                }
            })
        })

        it('debería llamar a Partida.count con el id_usuario correcto', async () => {
            Partida.count.mockResolvedValue(6)

            await obtenerPartidasPerdidas(50)

            const callArgs = Partida.count.mock.calls[0][0]
            expect(callArgs.where.id_usuario).toBe(50)
        })

        it('debería manejar error de conexión a BD', async () => {
            const error = new Error("Database disconnected")
            Partida.count.mockRejectedValue(error)

            await expect(obtenerPartidasPerdidas(1)).rejects.toThrow("Database disconnected")
        })
    })

    describe('Guardar partida', () => {
        it('debería guardar correctamente una partida ganada', async () => {
            const partidaCreada = {
                id_partida: 1,
                id_usuario: 5,
                oponente: 'mediumbot',
                ganada: true
            }
            Partida.create.mockResolvedValue(partidaCreada)

            const resultado = await guardarPartida(5, 'mediumbot', true)

            expect(resultado).toEqual(partidaCreada)
            expect(resultado.ganada).toBe(true)
        })

        it('debería guardar correctamente una partida perdida', async () => {
            const partidaCreada = {
                id_partida: 2,
                id_usuario: 3,
                oponente: 'random_bot',
                ganada: false
            }
            Partida.create.mockResolvedValue(partidaCreada)

            const resultado = await guardarPartida(3, 'random_bot', false)

            expect(resultado).toEqual(partidaCreada)
            expect(resultado.ganada).toBe(false)
        })

        it('debería llamar a Partida.create con los parámetros correctos', async () => {
            Partida.create.mockResolvedValue({ id_partida: 1 })

            await guardarPartida(7, 'mediumbot', true)

            expect(Partida.create).toHaveBeenCalledWith({
                id_usuario: 7,
                oponente: 'mediumbot',
                ganada: true
            })
        })

        it('debería guardar diferentes tipos de oponentes', async () => {
            const bots = ['random_bot', 'mediumbot', 'hard_bot']
            
            for (const bot of bots) {
                Partida.create.mockResolvedValue({
                    id_partida: 1,
                    id_usuario: 1,
                    oponente: bot,
                    ganada: true
                })

                await guardarPartida(1, bot, true)

                expect(Partida.create).toHaveBeenCalledWith(
                    expect.objectContaining({ oponente: bot })
                )
            }
        })

        it('debería devolver la partida creada con id_partida', async () => {
            const partidaMock = {
                id_partida: 42,
                id_usuario: 10,
                oponente: 'mediumbot',
                ganada: true
            }
            Partida.create.mockResolvedValue(partidaMock)

            const resultado = await guardarPartida(10, 'mediumbot', true)

            expect(resultado.id_partida).toBe(42)
        })

        it('debería manejar error cuando falla la creación en BD', async () => {
            const error = new Error("Database error: NOT NULL constraint failed")
            Partida.create.mockRejectedValue(error)

            await expect(guardarPartida(1, 'mediumbot', true))
                .rejects.toThrow("Database error: NOT NULL constraint failed")
        })

        it('debería permitir guardar múltiples partidas del mismo usuario', async () => {
            Partida.create
                .mockResolvedValueOnce({ id_partida: 1, id_usuario: 5, oponente: 'mediumbot', ganada: true })
                .mockResolvedValueOnce({ id_partida: 2, id_usuario: 5, oponente: 'random_bot', ganada: false })
                .mockResolvedValueOnce({ id_partida: 3, id_usuario: 5, oponente: 'mediumbot', ganada: true })

            const p1 = await guardarPartida(5, 'mediumbot', true)
            const p2 = await guardarPartida(5, 'random_bot', false)
            const p3 = await guardarPartida(5, 'mediumbot', true)

            expect(p1.id_partida).toBe(1)
            expect(p2.id_partida).toBe(2)
            expect(p3.id_partida).toBe(3)
            expect(Partida.create).toHaveBeenCalledTimes(3)
        })

        it('debería diferenciar partidas ganadas y perdidas del mismo usuario', async () => {
            const gananciaMock = { id_partida: 1, id_usuario: 2, oponente: 'bot', ganada: true }
            const perdidaMock = { id_partida: 2, id_usuario: 2, oponente: 'bot', ganada: false }

            Partida.create
                .mockResolvedValueOnce(gananciaMock)
                .mockResolvedValueOnce(perdidaMock)

            const ganada = await guardarPartida(2, 'bot', true)
            const perdida = await guardarPartida(2, 'bot', false)

            expect(ganada.ganada).toBe(true)
            expect(perdida.ganada).toBe(false)
        })

        it('debería manejar ids de usuario grandes', async () => {
            const usuarioId = 999999
            const partidaMock = {
                id_partida: 1,
                id_usuario: usuarioId,
                oponente: 'mediumbot',
                ganada: true
            }
            Partida.create.mockResolvedValue(partidaMock)

            const resultado = await guardarPartida(usuarioId, 'mediumbot', true)

            expect(resultado.id_usuario).toBe(usuarioId)
        })
    })

    describe('Integridad y consistencia de datos', () => {
        it('debería cumplir: ganadas + perdidas = jugadas', async () => {
            // Simulamos un escenario consistente
            // Usuarios: 1 con 10 partidas (6 ganadas, 4 perdidas)
            Partida.count
                .mockResolvedValueOnce(10)  // obtenerPartidasJugadas(1)
                .mockResolvedValueOnce(6)   // obtenerPartidasGanadas(1)
                .mockResolvedValueOnce(4)   // obtenerPartidasPerdidas(1)

            const j = await obtenerPartidasJugadas(1)
            const g = await obtenerPartidasGanadas(1)
            const p = await obtenerPartidasPerdidas(1)

            expect(j).toBe(10)
            expect(g).toBe(6)
            expect(p).toBe(4)
            expect(g + p).toBe(j)
        })

        it('debería funcionar correctamente para múltiples usuarios sin contaminar datos', async () => {
            Partida.count.mockResolvedValue(5)

            const usuario1 = await obtenerPartidasJugadas(1)
            const usuario2 = await obtenerPartidasJugadas(2)

            // Verificar que se llamó con IDs diferentes
            expect(Partida.count).toHaveBeenNthCalledWith(1, { where: { id_usuario: 1 } })
            expect(Partida.count).toHaveBeenNthCalledWith(2, { where: { id_usuario: 2 } })

            expect(usuario1).toBe(5)
            expect(usuario2).toBe(5)
        })

        it('debería manejar usuario con 0 partidas correctamente', async () => {
            Partida.count.mockResolvedValue(0)

            const jugadas = await obtenerPartidasJugadas(100)
            const ganadas = await obtenerPartidasGanadas(100)
            const perdidas = await obtenerPartidasPerdidas(100)

            expect(jugadas).toBe(0)
            expect(ganadas).toBe(0)
            expect(perdidas).toBe(0)
        })

        it('debería guardar y recuperar correctamente partidas de múltiples usuarios', async () => {
            // ========== USUARIO 1: 3 partidas (2 ganadas, 1 perdida) ==========
            const usuario1Partida1 = {
                id_partida: 1,
                id_usuario: 1,
                oponente: 'mediumbot',
                ganada: true
            }
            const usuario1Partida2 = {
                id_partida: 2,
                id_usuario: 1,
                oponente: 'random_bot',
                ganada: true
            }
            const usuario1Partida3 = {
                id_partida: 3,
                id_usuario: 1,
                oponente: 'mediumbot',
                ganada: false
            }

            // ========== USUARIO 2: 4 partidas (1 ganada, 3 perdidas) ==========
            const usuario2Partida1 = {
                id_partida: 4,
                id_usuario: 2,
                oponente: 'random_bot',
                ganada: true
            }
            const usuario2Partida2 = {
                id_partida: 5,
                id_usuario: 2,
                oponente: 'mediumbot',
                ganada: false
            }
            const usuario2Partida3 = {
                id_partida: 6,
                id_usuario: 2,
                oponente: 'mediumbot',
                ganada: false
            }
            const usuario2Partida4 = {
                id_partida: 7,
                id_usuario: 2,
                oponente: 'random_bot',
                ganada: false
            }

            // Simular creación de partidas
            Partida.create
                .mockResolvedValueOnce(usuario1Partida1)
                .mockResolvedValueOnce(usuario1Partida2)
                .mockResolvedValueOnce(usuario1Partida3)
                .mockResolvedValueOnce(usuario2Partida1)
                .mockResolvedValueOnce(usuario2Partida2)
                .mockResolvedValueOnce(usuario2Partida3)
                .mockResolvedValueOnce(usuario2Partida4)

            // Guardar partidas
            await guardarPartida(1, 'mediumbot', true)
            await guardarPartida(1, 'random_bot', true)
            await guardarPartida(1, 'mediumbot', false)
            await guardarPartida(2, 'random_bot', true)
            await guardarPartida(2, 'mediumbot', false)
            await guardarPartida(2, 'mediumbot', false)
            await guardarPartida(2, 'random_bot', false)

            // Simular recuperación de partidas para usuario 1
            Partida.count
                .mockResolvedValueOnce(3)  // obtenerPartidasJugadas(1)
                .mockResolvedValueOnce(2)  // obtenerPartidasGanadas(1)
                .mockResolvedValueOnce(1)  // obtenerPartidasPerdidas(1)
                // Simular recuperación de partidas para usuario 2
                .mockResolvedValueOnce(4)  // obtenerPartidasJugadas(2)
                .mockResolvedValueOnce(1)  // obtenerPartidasGanadas(2)
                .mockResolvedValueOnce(3)  // obtenerPartidasPerdidas(2)

            // Recuperar y validar datos de usuario 1
            const u1_jugadas = await obtenerPartidasJugadas(1)
            const u1_ganadas = await obtenerPartidasGanadas(1)
            const u1_perdidas = await obtenerPartidasPerdidas(1)

            expect(u1_jugadas).toBe(3)
            expect(u1_ganadas).toBe(2)
            expect(u1_perdidas).toBe(1)
            expect(u1_ganadas + u1_perdidas).toBe(u1_jugadas)

            // Recuperar y validar datos de usuario 2
            const u2_jugadas = await obtenerPartidasJugadas(2)
            const u2_ganadas = await obtenerPartidasGanadas(2)
            const u2_perdidas = await obtenerPartidasPerdidas(2)

            expect(u2_jugadas).toBe(4)
            expect(u2_ganadas).toBe(1)
            expect(u2_perdidas).toBe(3)
            expect(u2_ganadas + u2_perdidas).toBe(u2_jugadas)

            // Verificar que los datos no se contaminaron entre usuarios
            expect(u1_jugadas).not.toBe(u2_jugadas)
            expect(u1_ganadas).not.toBe(u2_ganadas)
            expect(u1_perdidas).not.toBe(u2_perdidas)

            // Verificar que las llamadas a Partida.create fueron correctas
            expect(Partida.create).toHaveBeenNthCalledWith(1, {
                id_usuario: 1,
                oponente: 'mediumbot',
                ganada: true
            })
            expect(Partida.create).toHaveBeenNthCalledWith(4, {
                id_usuario: 2,
                oponente: 'random_bot',
                ganada: true
            })
        })
    })
})

describe('Pruebas de Endpoints de Estadísticas', () => {
    let agent
    const usuarioMock = {
        id_usuario: 1,
        nombre: "Test User",
        nom_usuario: "testuser",
        contrasena: "cf3bb5beba6c60a05e697521c59aa5303805e07da980e4807ae25fd92a8458ad$7e38627095a070b8df3d0af12b9857aa6a56a350e6eba7bf867a95800d25fc58"
    }

    beforeEach(async () => {
        vi.clearAllMocks()
        agent = request.agent(app)
        // Mock del usuario por defecto
        Usuario.findOne.mockResolvedValue(usuarioMock)
        // Login por defecto para todos los tests
        await agent.post('/login').send({ nom_usuario: "testuser", contrasena: "ADMSIS123$" })
    })

    describe('POST /guardar-partida', () => {
        it('debería guardar una partida exitosamente con usuario autenticado', async () => {
            const partidaMock = {
                id_partida: 1,
                id_usuario: 1,
                oponente: 'mediumbot',
                ganada: true
            }
            Partida.create.mockResolvedValue(partidaMock)

            const res = await agent
                .post('/guardar-partida')
                .send({ oponente: 'mediumbot', ganada: true })

            expect(res.status).toBe(200)
            expect(res.body.message).toBe("Partida guardada correctamente.")
            expect(res.body.partida).toEqual(partidaMock)
            expect(Partida.create).toHaveBeenCalledWith({
                id_usuario: 1,
                oponente: 'mediumbot',
                ganada: true
            })
        })

        it('debería guardar una partida perdida correctamente', async () => {
            const partidaMock = {
                id_partida: 2,
                id_usuario: 1,
                oponente: 'random_bot',
                ganada: false
            }
            Partida.create.mockResolvedValue(partidaMock)

            const res = await agent
                .post('/guardar-partida')
                .send({ oponente: 'random_bot', ganada: false })

            expect(res.status).toBe(200)
            expect(res.body.partida.ganada).toBe(false)
            expect(res.body.partida.oponente).toBe('random_bot')
        })

        it('debería devolver 403 si no hay usuario autenticado', async () => {
            const agentNoAuth = request.agent(app)
            const res = await agentNoAuth
                .post('/guardar-partida')
                .send({ oponente: 'mediumbot', ganada: true })

            expect(res.status).toBe(403)
            expect(res.body.error).toBe("No hay usuario autenticado.")
        })

        it('debería devolver 400 si falta el parámetro "oponente"', async () => {

            const res = await agent
                .post('/guardar-partida')
                .send({ ganada: true })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Faltan parámetros: oponente y ganada son requeridos.")
        })

        it('debería devolver 400 si falta el parámetro "ganada"', async () => {

            const res = await agent
                .post('/guardar-partida')
                .send({ oponente: 'mediumbot' })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Faltan parámetros: oponente y ganada son requeridos.")
        })

        it('debería devolver 400 si "ganada" tiene valor null o undefined', async () => {

            const res = await agent
                .post('/guardar-partida')
                .send({ oponente: 'mediumbot', ganada: null })

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Faltan parámetros: oponente y ganada son requeridos.")
        })

        it('debería devolver 400 si faltan ambos parámetros requeridos', async () => {

            const res = await agent
                .post('/guardar-partida')
                .send({})

            expect(res.status).toBe(400)
            expect(res.body.error).toContain("Faltan parámetros: oponente y ganada son requeridos.")
        })

        it('debería devolver 500 si ocurre un error en la base de datos', async () => {

            const error = new Error("Database error")
            Partida.create.mockRejectedValue(error)

            const res = await agent
                .post('/guardar-partida')
                .send({ oponente: 'mediumbot', ganada: true })

            expect(res.status).toBe(500)
            expect(res.body.error).toBe("Error al guardar la partida.")
        })

        it('debería guardar diferentes tipos de oponentes correctamente', async () => {
            const oponentes = ['random_bot', 'mediumbot', 'hard_bot']
            
            for (const oponente of oponentes) {
                const partidaMock = {
                    id_partida: Math.random(),
                    id_usuario: 1,
                    oponente: oponente,
                    ganada: true
                }
                Partida.create.mockResolvedValue(partidaMock)

                const res = await agent
                    .post('/guardar-partida')
                    .send({ oponente: oponente, ganada: true })

                expect(res.status).toBe(200)
                expect(res.body.partida.oponente).toBe(oponente)
            }
        })

        it('debería guardar varias partidas ganadas y perdidas del mismo usuario', async () => {
            Partida.create
                .mockResolvedValueOnce({ id_partida: 1, id_usuario: 1, oponente: 'bot1', ganada: true })
                .mockResolvedValueOnce({ id_partida: 2, id_usuario: 1, oponente: 'bot2', ganada: false })

            const resGanada = await agent
                .post('/guardar-partida')
                .send({ oponente: 'bot1', ganada: true })

            const resPerdida = await agent
                .post('/guardar-partida')
                .send({ oponente: 'bot2', ganada: false })

            expect(resGanada.status).toBe(200)
            expect(resGanada.body.partida.ganada).toBe(true)
            expect(resPerdida.status).toBe(200)
            expect(resPerdida.body.partida.ganada).toBe(false)
            expect(Partida.create).toHaveBeenCalledTimes(2)
        })
    })

    describe('GET /stats/:nom_usuario', () => {
        it('debería obtener las estadísticas correctamente del usuario autenticado', async () => {
            Partida.count
                .mockResolvedValueOnce(15)  // partidas jugadas
                .mockResolvedValueOnce(8)   // partidas ganadas
                .mockResolvedValueOnce(7)   // partidas perdidas

            const res = await agent
                .get('/stats/testuser')

            expect(res.status).toBe(200)
            expect(res.body.jugadas).toBe(15)
            expect(res.body.ganadas).toBe(8)
            expect(res.body.perdidas).toBe(7)
        })

        it('debería devolver 403 si no hay usuario autenticado', async () => {
            const agentNoAuth = request.agent(app)
            const res = await agentNoAuth
                .get('/stats/testuser')

            expect(res.status).toBe(403)
            expect(res.body.error).toBe("No hay usuario autenticado.")
        })

        it('debería obtener estadísticas de usuario sin partidas (0, 0, 0)', async () => {
            Partida.count
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0)
                .mockResolvedValueOnce(0)

            const res = await agent
                .get('/stats/testuser')

            expect(res.status).toBe(200)
            expect(res.body.jugadas).toBe(0)
            expect(res.body.ganadas).toBe(0)
            expect(res.body.perdidas).toBe(0)
        })

        it('debería mantener la consistencia: ganadas + perdidas = jugadas', async () => {
            Partida.count
                .mockResolvedValueOnce(20)  // jugadas
                .mockResolvedValueOnce(12)  // ganadas
                .mockResolvedValueOnce(8)   // perdidas

            const res = await agent
                .get('/stats/testuser')

            expect(res.status).toBe(200)
            expect(res.body.ganadas + res.body.perdidas).toBe(res.body.jugadas)
        })

        it('debería devolver 404 si se intentan obtener estadísticas de un usuario inexistente', async () => {
            // Reescribimos el mock para este test: el usuario no existe
            Usuario.findOne.mockResolvedValueOnce(null)

            const res = await agent
                .get('/stats/usuarioInexistente')

            expect(res.status).toBe(404)
            expect(res.body.error).toBe("Usuario no encontrado.")
        })

        it('debería devolver 500 si ocurre un error al obtener estadísticas', async () => {
            const error = new Error("Database connection failed")
            Partida.count.mockRejectedValue(error)

            const res = await agent
                .get('/stats/testuser')

            expect(res.status).toBe(500)
            expect(res.body.error).toBe("Error al obtener estadísticas.")
        })

        it('debería fallar en obtener datos si algún count falla', async () => {
            Partida.count.mockRejectedValueOnce(new Error("DB Error"))

            const res = await agent
                .get('/stats/usuario')

            expect(res.status).toBe(500)
            expect(res.body.error).toBe("Error al obtener estadísticas.")
        })

        it('debería obtener las estadísticas correctamente para usuarios con muchas partidas', async () => {
            Partida.count
                .mockResolvedValueOnce(1000)  // jugadas
                .mockResolvedValueOnce(750)   // ganadas
                .mockResolvedValueOnce(250)   // perdidas

            const res = await agent
                .get('/stats/testuser')

            expect(res.status).toBe(200)
            expect(res.body.jugadas).toBe(1000)
            expect(res.body.ganadas).toBe(750)
            expect(res.body.perdidas).toBe(250)
            expect(res.body.ganadas + res.body.perdidas).toBe(res.body.jugadas)
        })
    })
})
