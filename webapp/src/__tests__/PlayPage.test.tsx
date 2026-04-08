import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import PlayPage from '../pages/PlayPage'
import GamePage from '../pages/GamePage'
import '@testing-library/jest-dom'

// 1. Mockeamos el componente Board para aislar la prueba de PlayPage.
// Así evitamos que Board intente hacer llamadas a la API (fetch) durante este test.
vi.mock('../components/Board', () => ({
  Board: () => <div data-testid="mock-board">Tablero Simulado</div>
}))

// También mockeamos las RUTAS por si cambian en el futuro, pero aquí usamos
// valores simples para asegurar la prueba.
vi.mock('../routes/constants', () => ({
  ROUTES: {
    GAME_PATH: (username: string) => `/game/${username}`
  }
}))

describe('Pruebas unitarias de la página de Partida (PlayPage)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('debería extraer el nombre de usuario de la sesión y mostrarlo en el título', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" onBackToLobby={()=>{}}/>
    )

    // Comprobamos que el nombre aparece en la pantalla
    expect(await screen.findByText("Partida de:")).toBeTruthy()
    expect(await screen.findByText("pepe")).toBeTruthy()
  })

  it('debería renderizar el componente Board (Tablero)', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" onBackToLobby={()=>{}}/>
    )

    // Buscamos nuestro tablero "mockeado"
    expect(await screen.findByTestId('mock-board')).toBeTruthy()
  })

  it('debería navegar de vuelta al Lobby al pulsar "Abandonar Partida"', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )
    
    // Buscamos el botón de jugar
    const playButton = await screen.findByRole('button', { name: /JUGAR/i })
    expect(playButton).toBeTruthy()
    fireEvent.click(playButton)

    // Buscamos el botón de abandonar
    const abandonButton = await screen.findByRole('button', { name: /Salir/i })
    expect(abandonButton).toBeTruthy()

    // Hacemos clic en el botón
    fireEvent.click(abandonButton)

    // Esperamos que la URL haya cambiado y ahora estemos viendo el componente ficticio del Lobby
    await waitFor(() => {
      expect(screen.getByText('Juego Y')).toBeTruthy()
    })
  })
})
