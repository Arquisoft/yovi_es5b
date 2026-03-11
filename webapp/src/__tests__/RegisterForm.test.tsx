import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../components/forms/RegisterForm'
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

describe('RegisterForm - Pruebas para secuencia de registro', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Validación de campos', () => {
    test('muestra error cuando todos los campos están vacíos', async () => {
      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando falta el nombre completo', async () => {
      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando falta el nombre de usuario', async () => {
      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando falta la contraseña', async () => {
      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('comprueba que espacios en blanco no cuentan como entrada', async () => {
      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre completo/i), '   ')
      await user.type(screen.getByLabelText(/nombre de usuario/i), '  ')
      await user.type(screen.getByLabelText(/contraseña/i), ' ')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Registro válido', () => {
    test('usuario introduce datos válidos y se registra correctamente', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'chema1' }),
      } as Response)
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre: 'Pepe Viyuela',
            nom_usuario: 'chema1',
            contrasena: 'Contraseña123!',
          }),
        })
        expect(mockOnSuccess).toHaveBeenCalledWith('chema1')
      })
    })
  })

  describe('Mensajes de error adecuados', () => {
    test('muestra mensaje de error cuando el usuario ya existe', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'El usuario ya existe' }),
      } as Response)
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/el usuario ya existe/i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando la contraseña tiene menos de 8 caracteres', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'La contraseña debe tener al menos 8 caracteres' }),
      } as Response)
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña1')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/la contraseña debe tener al menos 8 caracteres/i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando no se puede conectar con el servidor de usuarios', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Connection refused'))
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(screen.getByText(/no se pudo conectar con el servidor de usuarios\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Envío de datos al servidor', () => {
    test('hace petición POST al endpoint correcto', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'testuser' }),
      } as Response)
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/register',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    test('envía la información que espera el backend', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'testuser' }),
      } as Response)
      global.fetch = mockFetch

      render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre completo/i), 'Pepe Viyuela')
      await user.type(screen.getByLabelText(/nombre de usuario/i), 'chema1')
      await user.type(screen.getByLabelText(/contraseña/i), 'Contraseña123!')
      await user.click(screen.getByRole('button', { name: /aceptar registro/i }))

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body).toHaveProperty('nombre')
        expect(body).toHaveProperty('nom_usuario')
        expect(body).toHaveProperty('contrasena')
      })
    })
  })
})
