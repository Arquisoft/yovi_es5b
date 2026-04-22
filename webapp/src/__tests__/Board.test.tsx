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
    const { container } = render(<Board boardSize={5} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)

    expect(screen.getByText(/Tu turno \(Juegas con Azul\)/i)).toBeTruthy()
    // Tablero tamaño 5 = 15 hexágonos
    const hexagons = container.querySelectorAll('polygon')
    expect(hexagons.length).toBe(15)
  })

  it('debería llamar a la API y cambiar el estado al hacer clic en un hexágono', async () => {
    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
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

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
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

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
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

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
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

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
    fireEvent.click(container.querySelectorAll('polygon')[0])

    await waitFor(() => {
      expect(screen.getByText(/¡HAS GANADO LA PARTIDA!/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Volver a jugar/i })).toBeTruthy()
    })
  })

  it('debería renderizar el número correcto de hexágonos para un tamaño de tablero personalizado', () => {
    // Tablero tamaño 3 = 3*4/2 = 6 hexágonos
    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)

    const hexagons = container.querySelectorAll('polygon')
    expect(hexagons.length).toBe(6)
  })
})

describe('Pruebas del modo PvP (Jugador vs Jugador)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock por defecto: partida en curso, nadie ha ganado todavía
    global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
        api_version: 'v1',
        status: { Ongoing: { next_player: 0 } }
    })
    } as Response)
  })

  it('debería mostrar el turno del Jugador 1 al inicio en modo PvP', () => {
    render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="pvp" player1Name="Guille" player2Name="Pepe"/>)

    expect(screen.getByText(/Turno de Guille \(Azul\)/i)).toBeTruthy()
  })

  it('debería alternar al turno del Jugador 2 tras el movimiento del Jugador 1', async () => {
    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="pvp" player1Name="Guille" player2Name="Pepe"/>)

    fireEvent.click(container.querySelectorAll('polygon')[0])

    await waitFor(() => {
      expect(screen.getByText(/Turno de Pepe \(Rojo\)/i)).toBeTruthy()
    })
  })

  it('debería detectar la victoria del Jugador 1 en modo PvP', async () => {
    // winner:0 → J1 (Guille) gana
    global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
        api_version: 'v1',
        status: { Finished: { winner: 0 } }
    })
    } as Response)

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="pvp" player1Name="Guille" player2Name="Pepe"/>)
    fireEvent.click(container.querySelectorAll('polygon')[0])

    await waitFor(() => {
      expect(screen.getByText(/¡Guille GANA LA PARTIDA!/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Volver a jugar/i })).toBeTruthy()
    })
  })

  it('debería detectar la victoria del Jugador 2 en modo PvP', async () => {
    // J1 mueve primero (Ongoing) y luego J2 mueve (Finished winner:1 → J2 gana)
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
          api_version: 'v1',
          status: { Ongoing: { next_player: 0 } }
      })
    } as Response)
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          api_version: 'v1',
          status: { Finished: { winner: 1 } } // winner:1 → J2 (Pepe) gana
        }),
      } as Response)

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="pvp" player1Name="Guille" player2Name="Pepe"/>)
    const hexagons = container.querySelectorAll('polygon')

    // J1 mueve
    fireEvent.click(hexagons[0])
    await waitFor(() => {
      expect(screen.getByText(/Turno de Pepe \(Rojo\)/i)).toBeTruthy()
    })

    // J2 mueve
    fireEvent.click(hexagons[1])
    await waitFor(() => {
      expect(screen.getByText(/¡Pepe GANA LA PARTIDA!/i)).toBeTruthy()
      expect(screen.getByRole('button', { name: /Volver a jugar/i })).toBeTruthy()
    })
  })

  it('debería continuar la partida cuando el backend devuelve Ongoing', async () => {
    // Ongoing → nadie ganó, se alterna el turno
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        status: { Ongoing: { next_player: 1 } }
      }),
    } as Response)

    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="pvp" player1Name="Guille" player2Name="Pepe"/>)
    fireEvent.click(container.querySelectorAll('polygon')[0])

    // La partida continúa: se muestra el turno de J2
    await waitFor(() => {
      expect(screen.getByText(/Turno de Pepe \(Rojo\)/i)).toBeTruthy()
    })
  })
})

describe('Pruebas de la sugerencia de movimiento (bridgebot)', () => {
 
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock por defecto: bridgebot devuelve una sugerencia válida.
    // Los tests individuales pueden sobreescribirlo con mockImplementation
    // para distinguir entre la llamada de bot normal y la de sugerencia según la URL.
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        api_version: 'v1',
        bot_id: 'bridgebot',
        coords: { x: 2, y: 0, z: 0 },
        status: { Ongoing: { next_player: 0 } }
      }),
    } as Response)
  })
 
  it('debería mostrar el botón de sugerencia habilitado al inicio de la partida', () => {
    render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
 
    const btn = screen.getByRole('button', { name: /Sugerir movimiento/i }) as HTMLButtonElement
    expect(btn).toBeTruthy()
    expect(btn.disabled).toBe(false)
  })
 
  it('debería llamar al endpoint de bridgebot con turn=0 cuando el humano pide sugerencia', async () => {
    render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
 
    fireEvent.click(screen.getByRole('button', { name: /Sugerir movimiento/i }))
 
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringMatching(/\/v1\/ybot\/choose\/bridgebot$/),
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('"turn":0'),
        })
      )
    })
  })
 
  it('debería resaltar en dorado la casilla sugerida por el bridgebot', async () => {
    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
 
    // Antes de pedir sugerencia, ningún hexágono está dorado
    const doradosAntes = Array.from(container.querySelectorAll('polygon'))
      .filter(p => p.getAttribute('fill') === '#fbbf24')
    expect(doradosAntes.length).toBe(0)
 
    fireEvent.click(screen.getByRole('button', { name: /Sugerir movimiento/i }))
 
    // Después de pedir sugerencia, exactamente un hexágono se pinta en dorado
    await waitFor(() => {
      const doradosDespues = Array.from(container.querySelectorAll('polygon'))
        .filter(p => p.getAttribute('fill') === '#fbbf24')
      expect(doradosDespues.length).toBe(1)
    })
  })
 
  it('debería deshabilitar el botón tras pedir la sugerencia y mostrar "Sugerencia ya utilizada"', async () => {
    render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
 
    fireEvent.click(screen.getByRole('button', { name: /Sugerir movimiento/i }))
 
    await waitFor(() => {
      const btn = screen.getByRole('button', { name: /Sugerencia ya utilizada/i }) as HTMLButtonElement
      expect(btn.disabled).toBe(true)
    })
  })
 
  it('debería limpiar el resaltado dorado al hacer clic en cualquier hexágono', async () => {
    // fetch diferenciado: bridgebot devuelve (1,0,1), random_bot (0,0,2)
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes('bridgebot')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            api_version: 'v1',
            bot_id: 'bridgebot',
            coords: { x: 1, y: 0, z: 1 },
            status: { Ongoing: { next_player: 0 } }
          }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          api_version: 'v1',
          bot_id: 'random_bot',
          coords: { x: 0, y: 0, z: 2 },
          status: { Ongoing: { next_player: 0 } }
        }),
      } as Response)
    })
 
    const { container } = render(<Board boardSize={3} botId="random_bot" difficulty="easy" gameMode="bot" player1Name="Jugador" player2Name="Invitado"/>)
 
    // Pide sugerencia y espera a que aparezca el dorado
    fireEvent.click(screen.getByRole('button', { name: /Sugerir movimiento/i }))
    await waitFor(() => {
      const dorados = Array.from(container.querySelectorAll('polygon'))
        .filter(p => p.getAttribute('fill') === '#fbbf24')
      expect(dorados.length).toBe(1)
    })
 
    // Clica un hexágono cualquiera: el resaltado dorado debe desaparecer
    fireEvent.click(container.querySelectorAll('polygon')[5])
    await waitFor(() => {
      const dorados = Array.from(container.querySelectorAll('polygon'))
        .filter(p => p.getAttribute('fill') === '#fbbf24')
      expect(dorados.length).toBe(0)
    })
  })
})
