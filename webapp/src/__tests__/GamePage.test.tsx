import { render, screen, waitFor } from '@testing-library/react'
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
        <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )
    
    const title = await screen.findByText(/Juego Y/i)
    expect(title).toBeTruthy()
  })

  it('should display welcome message with username from URL', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )
    
    const welcome = await screen.findByText(/Bienvenido/i)
    const username = await screen.findByText('Pepe')
    
    expect(welcome).toBeTruthy()
    expect(username).toBeTruthy()
  })

  it('should check gamey status on mount', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('http://localhost:4000/status')
    })
  })

  it('should display connected status when gamey is OK', async () => {
    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
    )

    const statusText = await screen.findByText(/Conectado/i)
    expect(statusText).toBeTruthy()
  })

  it('should display disconnected status when gamey is down', async () => {
    global.fetch = vi.fn().mockRejectedValueOnce(new Error('Connection failed'))

    render(
      <GamePage user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }}/>
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
})
