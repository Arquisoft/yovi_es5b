import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import { Board } from '../components/Board'
import '@testing-library/jest-dom'

describe('Pruebas unitarias del Tablero (Board)', () => {

  beforeEach(() => {
    // Limpiamos el historial de llamadas de las funciones mockeadas (igual que en backend)
    vi.clearAllMocks()
    
    // Configuramos un mock de fetch por defecto (Ongoing)
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        bot_id: 'random_bot',
        coords: { x: 0, y: 0, z: 4 },
        status: { Ongoing: { next_player: 0 } }
      }),
    } as Response)
  })

  it('debería renderizar el tablero inicial correctamente', () => {
    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    
    expect(screen.getByText(/Tu turno \(Juegas con Azul\)/i)).toBeTruthy()
    // Tablero tamaño 5 = 15 hexágonos
    const hexagons = container.querySelectorAll('polygon')
    expect(hexagons.length).toBe(15)
  })

  it('debería llamar a la API y cambiar el estado al hacer clic en un hexágono', async () => {
    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    const hexagons = container.querySelectorAll('polygon')

    fireEvent.click(hexagons[0])

    expect(screen.getByText(/El bot está pensando.../i)).toBeTruthy()
    expect(global.fetch).toHaveBeenCalledTimes(1) // Verificamos la llamada a la API
    
    await waitFor(() => {
      expect(screen.getByText(/Tu turno \(Juegas con Azul\)/i)).toBeTruthy()
    })
  })

  it('debería detectar la victoria del jugador (Humano) y permitir resetear', async () => {
    // Sobrescribimos el mock para simular victoria
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        bot_id: 'random_bot',
        coords: { x: 1, y: 1, z: 2 },
        status: { Finished: { winner: 0 } } // 0 = Humano
      }),
    } as Response)

    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    const hexagons = container.querySelectorAll('polygon')

    fireEvent.click(hexagons[0])

    await waitFor(() => {
      expect(screen.getByText(/¡HAS GANADO LA PARTIDA!/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Volver a jugar/i })).toBeTruthy()
    })
  })

  it('debería detectar la victoria del Bot', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        bot_id: 'random_bot',
        coords: { x: 2, y: 2, z: 0 },
        status: { Finished: { winner: 1 } } // 1 = Bot
      }),
    } as Response)

    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    const hexagons = container.querySelectorAll('polygon')

    fireEvent.click(hexagons[0])

    await waitFor(() => {
      expect(screen.getByText(/El Bot te ha ganado.../i)).toBeTruthy()
    })
  })

  it('debería manejar el error de red si el bot server falla (catch)', async () => {
    // Espiamos el console.error para ver si nuestro catch lo llama
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Bot server down'))

    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    fireEvent.click(container.querySelectorAll('polygon')[0])

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error al contactar con el bot:", expect.any(Error))
    })
    consoleSpy.mockRestore()
  })

  it('debería detectar la victoria del humano cuando llena el tablero con el último movimiento', async () => {
    // Simulamos que el backend devuelve status Finished con winner 0 (humano)
    // y coords vacías porque el tablero está lleno y el bot no puede mover
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        bot_id: 'random_bot',
        coords: { x: 0, y: 0, z: 0 },
        status: { Finished: { winner: 0 } } // 0 = Humano ganó con la última casilla
      }),
    } as Response)

    const { container } = render(<Board botId="random_bot" difficulty="easy"/>)
    fireEvent.click(container.querySelectorAll('polygon')[0])

    await waitFor(() => {
      expect(screen.getByText(/¡HAS GANADO LA PARTIDA!/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Volver a jugar/i })).toBeTruthy()
    })
  })
})
