import { render, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { Hexagon } from '../components/Hexagon'

describe('Pruebas unitarias del componente Hexagon', () => {
  
  it('debería renderizar un polígono SVG con los puntos calculados y el color por defecto', () => {
    // Renderizamos un hexágono en la posición 100,100 con tamaño 30
    const { container } = render(<Hexagon cx={100} cy={100} size={30} />)
    
    // Buscamos la etiqueta <polygon> de SVG
    const polygon = container.querySelector('polygon')

    expect(polygon).toBeTruthy()
    
    // Verificamos el color por defecto que programaste
    expect(polygon?.getAttribute('fill')).toBe('#eeeeee')
    
    // Verificamos que las matemáticas han generado la cadena de puntos (points="x,y x,y...")
    expect(polygon?.getAttribute('points')).toBeTruthy()
    expect(polygon?.getAttribute('points')?.length).toBeGreaterThan(10)
  })

  it('debería aplicar el color personalizado que se le pasa por props', () => {
    const { container } = render(<Hexagon cx={0} cy={0} size={10} color="#ff0000" />)
    const polygon = container.querySelector('polygon')

    // Verificamos que asume el color rojo
    expect(polygon?.getAttribute('fill')).toBe('#ff0000')
  })

  it('debería ejecutar la función onClick al ser pulsado', () => {
    // Creamos una función espía (mock)
    const mockOnClick = vi.fn()
    
    const { container } = render(<Hexagon cx={0} cy={0} size={10} onClick={mockOnClick} />)
    const polygon = container.querySelector('polygon')

    // Simulamos el clic del usuario
    fireEvent.click(polygon!)

    // Verificamos que nuestro espía detectó exactamente 1 clic
    expect(mockOnClick).toHaveBeenCalledTimes(1)
  })
})