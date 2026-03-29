import { render, screen } from '@testing-library/react'
import { vi, beforeEach, describe, it, expect } from 'vitest'
import Estadisticas from '../pages/Estadisticas.tsx'
import '@testing-library/jest-dom'


describe('Pruebas unitarias de la página de estadísticas (Estadisticas)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  });

  it('debería mostrar las estadísticas de partidas jugadas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {return {jugadas: 7, ganadas: 23, perdidas: 45}}
    })
    render(
        <Estadisticas user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} onBack={()=>{}}/>
    )

    // Comprobamos que las partidas jugadas del usuario aparecen en pantalla
    expect(await screen.findByText("Partidas jugadas")).toBeTruthy()
    expect(await screen.findByText("7")).toBeTruthy()
  });

  it('debería mostrar las estadísticas de partidas ganadas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {return {jugadas: 7, ganadas: 23, perdidas: 45}}
    })
    render(
        <Estadisticas user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} onBack={()=>{}}/>
    )

    // Comprobamos que las partidas jugadas del usuario aparecen en pantalla
    expect(await screen.findByText("Partidas ganadas")).toBeTruthy()
    expect(await screen.findByText("23")).toBeTruthy()
  });

  it('debería mostrar las estadísticas de partidas perdidas', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {return {jugadas: 7, ganadas: 23, perdidas: 45}}
    })
    render(
        <Estadisticas user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} onBack={()=>{}}/>
    )

    // Comprobamos que las partidas jugadas del usuario aparecen en pantalla
    expect(await screen.findByText("Partidas perdidas")).toBeTruthy()
    expect(await screen.findByText("45")).toBeTruthy()
  });

  it('debería mostrar el nombre del usuario', async () => {
    render(
        <Estadisticas user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} onBack={()=>{}}/>
    )

    // Comprobamos que las partidas ganas del usuario aparecen en pantalla
    expect(await screen.findByText("Estadísticas de Pepe")).toBeTruthy()
  });

  it('debería existir el botón de volver al menú', async () => {
    render(
        <Estadisticas user={{id:"1", nombre: "Pepe", nom_usuario:"pepe" }} onBack={()=>{}}/>
    )

    // Comprobamos que existe el botón de volver al menú
    const volverButton = await screen.findByRole('button', { name: /VOLVER AL MENÚ/i })
    expect(volverButton).toBeTruthy()
  });

})
