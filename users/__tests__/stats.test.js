import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import request from 'supertest'
import { app } from '../users-service.js'
import { Usuario } from '../models/index.js'
import * as statsModule from '../service/stats.js'

// Mockeamos express-session para inyectar sesión sin login real
vi.mock('express-session', () => ({
    default: () => (req, res, next) => {
        req.session = {
            user: {
                id_usuario: 1,
                nombre: 'Pepe',
                nom_usuario: 'pepe123'
            }
        }
        next()
    }
}))

// Mockeamos el módulo de stats
vi.mock('../service/stats.js', () => ({
    obtenerPartidasJugadas: vi.fn(),
    obtenerPartidasGanadas: vi.fn(),
    obtenerPartidasPerdidas: vi.fn()
}))

// Mockeamos los modelos
vi.mock('../models/index.js', () => ({
    Usuario: {
        findOne: vi.fn(),
        findAll: vi.fn(),
        create: vi.fn()
    },
    Jugador: {
        findAll: vi.fn(),
        count: vi.fn()
    },
    Partida: {
        count: vi.fn()
    },
    sequelize: {
        authenticate: vi.fn().mockResolvedValue(),
        sync: vi.fn().mockResolvedValue()
    }
}))

// Helper para obtener un agente con sesión mockeada
const obtenerAgente = () => {
    return request.agent(app)
}

describe('Pruebas de Estadísticas - Endpoint /stats/jugadas', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debería devolver 403 si no hay usuario autenticado', async () => {
        const res = await request(app)
            .get('/stats/jugadas')

        expect(res.status).toBe(403)
        expect(res.body.error).toBe("No hay usuario autenticado.")
    })

    it('debería devolver 200 con sesión válida', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(5)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/jugadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasJugadas).toBe(5)
    })

    it('debería devolver 0 partidas jugadas cuando el usuario no ha jugado ninguna partida', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(0)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/jugadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasJugadas).toBe(0)
    })

    it('debería devolver el número de partidas jugadas cuando ha jugado al menos 1', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(3)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/jugadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasJugadas).toBe(3)
    })

    it('debería devolver 500 cuando la base de datos no responde', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas)
            .mockRejectedValue(new Error("Database connection error"))

        const agent = obtenerAgente()
        const res = await agent.get('/stats/jugadas')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe("Error al obtener estadísticas.")
    })
})

describe('Pruebas de Estadísticas - Endpoint /stats/ganadas', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debería devolver 403 si no hay usuario autenticado', async () => {
        const res = await request(app)
            .get('/stats/ganadas')

        expect(res.status).toBe(403)
        expect(res.body.error).toBe("No hay usuario autenticado.")
    })

    it('debería devolver 200 con sesión válida', async () => {
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(3)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/ganadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasGanadas).toBe(3)
    })

    it('debería devolver 0 cuando el usuario no ha ganado partidas', async () => {
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(0)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/ganadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasGanadas).toBe(0)
    })

    it('debería devolver el número de partidas ganadas cuando ha ganado al menos 1', async () => {
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(5)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/ganadas')

        expect(res.status).toBe(200)
        expect(res.body.partidasGanadas).toBe(5)
    })

    it('debería devolver 500 cuando la base de datos no responde', async () => {
        vi.mocked(statsModule.obtenerPartidasGanadas)
            .mockRejectedValue(new Error("Database error"))

        const agent = obtenerAgente()
        const res = await agent.get('/stats/ganadas')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe("Error al obtener estadísticas.")
    })
})

describe('Pruebas de Estadísticas - Endpoint /stats/perdidas', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debería devolver 403 si no hay usuario autenticado', async () => {
        const res = await request(app)
            .get('/stats/perdidas')

        expect(res.status).toBe(403)
        expect(res.body.error).toBe("No hay usuario autenticado.")
    })

    it('debería devolver 200 con sesión válida', async () => {
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(2)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/perdidas')

        expect(res.status).toBe(200)
        expect(res.body.partidasPerdidas).toBe(2)
    })

    it('debería devolver 0 cuando el usuario no ha perdido partidas', async () => {
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(0)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/perdidas')

        expect(res.status).toBe(200)
        expect(res.body.partidasPerdidas).toBe(0)
    })

    it('debería devolver el número de partidas perdidas cuando ha perdido al menos 1', async () => {
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(4)

        const agent = obtenerAgente()
        const res = await agent.get('/stats/perdidas')

        expect(res.status).toBe(200)
        expect(res.body.partidasPerdidas).toBe(4)
    })

    it('debería devolver 500 cuando la base de datos no responde', async () => {
        vi.mocked(statsModule.obtenerPartidasPerdidas)
            .mockRejectedValue(new Error("Database error"))

        const agent = obtenerAgente()
        const res = await agent.get('/stats/perdidas')

        expect(res.status).toBe(500)
        expect(res.body.error).toBe("Error al obtener estadísticas.")
    })
})

describe('Pruebas de Estadísticas - Casos combinados', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('debería devolver 0 partidas en todos los endpoints cuando el usuario tiene 0 partidas', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(0)
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(0)
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(0)

        const agent = obtenerAgente()
        
        const res1 = await agent.get('/stats/jugadas')
        const res2 = await agent.get('/stats/ganadas')
        const res3 = await agent.get('/stats/perdidas')

        expect(res1.status).toBe(200)
        expect(res1.body.partidasJugadas).toBe(0)
        
        expect(res2.status).toBe(200)
        expect(res2.body.partidasGanadas).toBe(0)
        
        expect(res3.status).toBe(200)
        expect(res3.body.partidasPerdidas).toBe(0)
    })

    it('debería mantener consistencia: ganadas + perdidas = jugadas', async () => {
        const jugadas = 10
        const ganadas = 6
        const perdidas = 4

        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(jugadas)
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(ganadas)
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(perdidas)

        const agent = obtenerAgente()
        
        const res1 = await agent.get('/stats/jugadas')
        const res2 = await agent.get('/stats/ganadas')
        const res3 = await agent.get('/stats/perdidas')

        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)
        expect(res3.status).toBe(200)
        
        // Validar consistencia
        expect(res2.body.partidasGanadas + res3.body.partidasPerdidas).toBe(res1.body.partidasJugadas)
    })

    it('debería soportar múltiples requests consecutivos del mismo usuario autenticado', async () => {
        vi.mocked(statsModule.obtenerPartidasJugadas).mockResolvedValue(5)
        vi.mocked(statsModule.obtenerPartidasGanadas).mockResolvedValue(3)
        vi.mocked(statsModule.obtenerPartidasPerdidas).mockResolvedValue(2)

        const agent = obtenerAgente()
        
        // Múltiples requests consecutivos
        const res1 = await agent.get('/stats/jugadas')
        const res2 = await agent.get('/stats/ganadas')
        const res3 = await agent.get('/stats/perdidas')
        const res4 = await agent.get('/stats/jugadas')

        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)
        expect(res3.status).toBe(200)
        expect(res4.status).toBe(200)
    })
})
