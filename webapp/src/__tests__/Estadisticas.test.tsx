import { render, screen, fireEvent } from '@testing-library/react'
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

describe('Pruebas unitarias de la página de ranking (Estadisticas)', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  });

  it('debería mostrar el título "Ranking global" al pulsar el botón de ranking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Comprobamos que aparece el título del ranking
    expect(await screen.findByText("Ranking global")).toBeTruthy()
  });

  it('debería mostrar el nom_usuario de un jugador en la tabla de ranking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Comprobamos que aparece el usuario en la tabla
    expect(await screen.findByText("pepe")).toBeTruthy()
  });

  it('debería mostrar las partidas jugadas de un jugador en la tabla de ranking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Comprobamos que aparecen las partidas jugadas en la tabla
    expect(await screen.findByText("Partidas jugadas")).toBeTruthy()
    expect(await screen.findByText("7")).toBeTruthy()
  });

  it('debería mostrar las partidas ganadas de un jugador en la tabla de ranking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Comprobamos que aparecen las partidas ganadas en la tabla
    expect(await screen.findByText("Partidas ganadas")).toBeTruthy()
    expect(await screen.findByText("5")).toBeTruthy()
  });

  it('debería existir el botón de ver mis estadísticas en la página de ranking', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Comprobamos que existe el botón de volver a las estadísticas
    const verStatsButton = await screen.findByRole('button', { name: /VER MIS ESTADÍSTICAS/i })
    expect(verStatsButton).toBeTruthy()
  });

  it('debería volver a las estadísticas propias al pulsar "Ver mis estadísticas"', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([{ nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 }]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))
    fireEvent.click(await screen.findByRole('button', { name: /VER MIS ESTADÍSTICAS/i }))

    // Comprobamos que volvemos a la vista de estadísticas propias
    expect(await screen.findByText("Estadísticas de Pepe")).toBeTruthy()
  });

  it('debería mostrar fondo dorado, plateado y bronce para los tres primeros puestos', async () => {
    global.fetch = vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ jugadas: 7, ganadas: 5, perdidas: 2 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ([
        { nom_usuario: 'pepe', nombre: 'Pepe', jugadas: 7, ganadas: 5 },
        { nom_usuario: 'juan', nombre: 'Juan', jugadas: 4, ganadas: 3 },
        { nom_usuario: 'ana',  nombre: 'Ana',  jugadas: 2, ganadas: 1 },
      ]) })

    render(
      <Estadisticas user={{ id: "1", nombre: "Pepe", nom_usuario: "pepe" }} onBack={() => {}} />
    )

    fireEvent.click(await screen.findByRole('button', { name: /VER RANKING GLOBAL/i }))

    // Obtenemos las filas del cuerpo de la tabla (excluye el thead)
    const filas = await screen.findAllByRole('row')
    const [, primera, segunda, tercera] = filas // la primera fila es el thead, la ignoramos

    // Comprobamos los colores de fondo de cada fila
    // Hay que convertir los colores en hexadecimal a formato RGB.
    expect(primera.style.backgroundColor).toBe('rgb(255, 217, 0)')  // #FFD900 en RGB
    expect(segunda.style.backgroundColor).toBe('rgb(192, 192, 192)') // #C0C0C0 en RGB
    expect(tercera.style.backgroundColor).toBe('rgb(205, 127, 50)')  // #CD7F32 en RGB
  });
});