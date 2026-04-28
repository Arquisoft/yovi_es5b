import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import GamePage from '../pages/GamePage'
import { vi, beforeEach, describe, it, expect, afterEach } from 'vitest'

describe('GamePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock fetch globalmente antes de cada test
    globalThis.fetch = vi.fn().mockResolvedValue({
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
    
    const welcome = await screen.findByText(/Bienvenido, Pepe/i)
    expect(welcome).toBeTruthy()
  })

  it('should check gamey status on mount', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe123" }}/>
    )

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('http://localhost:4000/status')
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
    globalThis.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection failed'))

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
    const { container } = render(<GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe"}}/>)

    // Tomamos el selector de modo dentro del formulario de juego (ignora el selector de idioma del header)
    const gameModeSelect = container.querySelector('.register-form select') as HTMLSelectElement
    fireEvent.change(gameModeSelect, { target: { value: 'pvp' } })

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

  it('debería mostrar el slider cuando se selecciona "Personalizado"', async () => {
    const { container } = render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    // Obtén los 3 selects: game mode, bot, board size (en ese orden)
    const allSelects = container.querySelectorAll('.register-form select')
    const boardSizeSelect = allSelects[2] as HTMLSelectElement
    expect(boardSizeSelect).toBeTruthy()

    // Selecciona "Personalizado"
    fireEvent.change(boardSizeSelect, { target: { value: 'custom' } })

    // Verifica que el slider aparece
    await waitFor(() => {
      const slider = container.querySelector('#board-size-slider') as HTMLInputElement
      expect(slider).toBeTruthy()
    })
  })

  it('debería permitir cambiar el tamaño del tablero con el slider entre 3 y 25', async () => {
    const { container } = render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    // Obtén el tercer select (board size)
    const allSelects = container.querySelectorAll('.register-form select')
    const boardSizeSelect = allSelects[2] as HTMLSelectElement
    fireEvent.change(boardSizeSelect, { target: { value: 'custom' } })

    // Espera a que aparezca el slider
    await waitFor(() => {
      const slider = container.querySelector('#board-size-slider') as HTMLInputElement
      expect(slider).toBeTruthy()
    })

    const slider = container.querySelector('#board-size-slider') as HTMLInputElement
    if (!slider) throw new Error('Slider not found')

    // Cambia el valor del slider a 15
    fireEvent.change(slider, { target: { value: '15' } })

    // Verifica que la etiqueta se actualiza
    await waitFor(() => {
      expect(screen.getByText(/Tamaño del tablero: 15/i)).toBeTruthy()
    })
  })

  it('debería respetar los límites mínimo (3) y máximo (25) del slider', async () => {
    const { container } = render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    // Obtén el tercer select (board size)
    const allSelects = container.querySelectorAll('.register-form select')
    const boardSizeSelect = allSelects[2] as HTMLSelectElement
    fireEvent.change(boardSizeSelect, { target: { value: 'custom' } })

    await waitFor(() => {
      const slider = container.querySelector('#board-size-slider') as HTMLInputElement
      expect(slider).toBeTruthy()
    })

    const slider = container.querySelector('#board-size-slider') as HTMLInputElement
    if (!slider) throw new Error('Slider not found')

    // Verifica que el atributo min es 3
    expect(slider.getAttribute('min')).toBe('3')
    // Verifica que el atributo max es 25
    expect(slider.getAttribute('max')).toBe('25')

    // Prueba con valor mínimo
    fireEvent.change(slider, { target: { value: '3' } })
    await waitFor(() => {
      expect(screen.getByText(/Tamaño del tablero: 3/i)).toBeTruthy()
    })

    // Prueba con valor máximo
    fireEvent.change(slider, { target: { value: '25' } })
    await waitFor(() => {
      expect(screen.getByText(/Tamaño del tablero: 25/i)).toBeTruthy()
    })
  })
})
