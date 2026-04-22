import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GamePage from '../pages/GamePage'
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest'

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch globalmente antes de cada test
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    })
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  it('should display the game title', async () => {
    render(
        <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    const title = await screen.findByText(/Juego Y/i)
    expect(title).toBeTruthy()
  })

  it('should display welcome message with username from URL', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    const welcome = await screen.findByText(/Bienvenido/i)
    const username = await screen.findByText('Pepe')

    expect(welcome).toBeTruthy()
    expect(username).toBeTruthy()
  })

  it('should check gamey status on mount', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/status')
    })
  })

  it('should display connected status when gamey is OK', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    const statusText = await screen.findByText(/Conectado/i)
    expect(statusText).toBeTruthy()
  })

  it('should display disconnected status when gamey is down', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection failed'))

    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    const statusText = await screen.findByText(/Desconectado/i)
    expect(statusText).toBeTruthy()
  })

  it('should have a play button', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    const backButton = await screen.findByRole('button', { name: /JUGAR/i })
    expect(backButton).toBeTruthy()
  })

  it('debería mostrar el input del nombre del Jugador 2 al seleccionar modo PvP', async () => {
    render(<GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe"}}/>)

    const selects = await screen.findAllByRole('combobox')
    // El primer selector es el de modo de juego
    fireEvent.change(selects[0], { target: { value: 'pvp' } })

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Nombre del Jugador 2/i)).toBeTruthy()
    })
  })

  it('debería funcionar correctamente el botón de jugar', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    const playButton = await screen.findByRole('button', { name: /JUGAR/i })
    playButton.click();

    // Texto de PlayPage
    expect(await screen.findByText(/Es tu turno/i))
  })

  it('debería funcionar correctamente el botón de seleccionar dificultad', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    expect(screen.getByText('Bot Aleatorio (Fácil)')).toBeTruthy()
    screen.getByRole('option', { name: /Bot Medio \(Medio\)/i }).click();
    expect(screen.getByText('Bot Medio (Medio)')).toBeTruthy()
  })

  it('debería funcionar correctamente el botón de selector tamaño de tablero', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    expect(screen.getByText('Tablero pequeño')).toBeTruthy()
    screen.getByRole('option', { name: /Tablero mediano/i }).click();
    expect(screen.getByText('Tablero grande')).toBeTruthy()
  })
})
