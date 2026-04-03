import { describe, it, expect, vi, beforeEach } from 'vitest'
import { obtenerPartidasJugadas, obtenerPartidasGanadas, obtenerPartidasPerdidas } from '../service/stats.js'
import { Partida } from '../models/index.js'

// Mock del modelo Partida
vi.mock('../models/index.js', () => ({
    Partida: {
        count: vi.fn()
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
    })
})
