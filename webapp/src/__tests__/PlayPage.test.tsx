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
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => 'OK',
    })
  })

  it('debería extraer el nombre de usuario de la sesión y mostrarlo en el título', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    // Comprobamos que el nombre aparece en la pantalla
    expect(await screen.findByText("Partida de:")).toBeTruthy()
    expect(await screen.findByText("pepe")).toBeTruthy()
  })

  it('debería renderizar el componente Board (Tablero)', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    // Buscamos nuestro tablero "mockeado"
    expect(await screen.findByTestId('mock-board')).toBeTruthy()
  })

  it('debería mostrar los nombres de ambos jugadores en el título en modo PvP', async () => {
    render(
      <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"Guille"}} botId="random_bot" gameMode="pvp" player2Name="Pepe" onBackToLobby={() => {}}
            onChangeDifficulty={()=>{}}/>
    )

    expect(await screen.findByText('Guille')).toBeTruthy()
    expect(await screen.findByText('Pepe')).toBeTruthy()
  })

  it('debería mostrar selector de dificultad solo en modo bot', async () => {
    const { rerender } = render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    // En modo bot debería haber selector de dificultad
    const difficultySelect = screen.queryAllByRole('combobox').find(select => 
      select.querySelector('option[value="mediumbot"]')
    )
    expect(difficultySelect).toBeTruthy()

    // En modo PvP no debería haber selector de dificultad
    rerender(
      <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="pvp" player2Name="Pepe" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )
    
    const difficultySelects = screen.queryAllByRole('combobox')
    const hasDifficultyInPvp = difficultySelects.some(select => 
      select.querySelector('option[value="mediumbot"]')
    )
    expect(hasDifficultyInPvp).toBeFalsy()
  })

  it('debería llamar a onChangeDifficulty al cambiar dificultad', async () => {
    const mockChangeDifficulty = vi.fn()
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={mockChangeDifficulty}/>
    )

    // Selecciona el selector de dificultad (no el de idioma)
    const selects = screen.queryAllByRole('combobox')
    const difficultySelect = selects.find(select => 
      select.querySelector('option[value="mediumbot"]')
    ) as HTMLSelectElement

    expect(difficultySelect).toBeTruthy()
    
    fireEvent.change(difficultySelect, { target: { value: 'mediumbot' } })
    
    expect(mockChangeDifficulty).toHaveBeenCalledWith('mediumbot')
  })

  it('debería recrear el Board con nueva clave (gameKey) al cambiar dificultad', async () => {
    render(
      <PlayPage
        boardSize={3}
        user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }}
        botId="random_bot"
        gameMode="bot"
        player2Name="Invitado"
        onBackToLobby={() => { } }
        onChangeDifficulty={() => { } } />
    )

    const boardAntes = screen.getByTestId('mock-board');

    const selects = screen.queryAllByRole('combobox');
    const difficultySelect = selects.find(select => 
      select.querySelector('option[value="bridgebot"]')
    ) as HTMLSelectElement;

    fireEvent.change(difficultySelect, { target: { value: 'bridgebot' } });

    const boardDespues = await screen.findByTestId('mock-board');

    expect(boardAntes).not.toBe(boardDespues);
  });

  it('debería llamar a onBackToLobby al pulsar Abandonar Partida', async () => {
    const mockOnBackToLobby = vi.fn()
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={mockOnBackToLobby}
            onChangeDifficulty={()=>{}}/>
    )

    const abandonButton = screen.getByRole('button', { name: /Abandonar Partida/i })
    fireEvent.click(abandonButton)

    expect(mockOnBackToLobby).toHaveBeenCalled()
  })

  it('debería mostrar mensajes de ayuda diferente en modo bot vs PvP', async () => {
    const { rerender } = render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    // En modo bot
    expect(screen.getByText(/Es tu turno/i)).toBeTruthy()

    // Cambiar a PvP
    rerender(
      <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="pvp" player2Name="Pepe" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    // En modo PvP
    expect(screen.getByText(/Los jugadores se turnan/i)).toBeTruthy()
  })

  it('debería mostrar las reglas del juego', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    expect(screen.getByText(/Reglas del Jogo Y|Reglas del Juego Y/i)).toBeTruthy()
  })

  it('debería usar nombre de usuario por defecto si nom_usuario está vacío', async () => {
    render(
        <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"" }} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={()=>{}}
            onChangeDifficulty={()=>{}}/>
    )

    expect(screen.getByText(/Player|Jugador/i)).toBeTruthy()
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
    const abandonButton = await screen.findByRole('button', { name: /Abandonar Partida/i })
    expect(abandonButton).toBeTruthy()

    // Hacemos clic en el botón
    fireEvent.click(abandonButton)

    // Esperamos que la URL haya cambiado y ahora estemos viendo el componente ficticio del Lobby
    await waitFor(() => {
      expect(screen.getByText('Juego Y')).toBeTruthy()
    })
  })

  it('debería cambiar de dificultad correctamente', async () => {
    render(
      <PlayPage boardSize={3} user={{id:"1", nombre: "Pepe", nom_usuario:"Guille"}} botId="random_bot" gameMode="bot" player2Name="Invitado" onBackToLobby={() => {}}
            onChangeDifficulty={()=>{}}/>
    )

    expect(screen.getByText('Dificultad: Fácil')).toBeTruthy()
    screen.getByRole('option', { name: /Dificultad: Medio/i }).click();
    expect(screen.getByText('Dificultad: Medio')).toBeTruthy()
  })
})
