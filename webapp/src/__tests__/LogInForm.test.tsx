import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LogInForm from '../components/forms/LogInForm'
import { afterEach, describe, expect, test, vi, beforeEach } from 'vitest'
import '@testing-library/jest-dom'

describe('LogInForm - Pruebas para secuencia de login', () => {
  const mockOnSuccess = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch = vi.fn()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Validación de campos requeridos', () => {
    test('muestra error cuando ambos campos están vacíos', async () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando falta el nombre de usuario', async () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando falta la contraseña', async () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('valida que espacios en blanco no cuentan como entrada', async () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      const user = userEvent.setup()

      await user.type(screen.getByLabelText(/nombre de usuario/i), '   ')
      await user.type(screen.getByLabelText(/contraseña/i), '  ')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Inicio de sesión correcto', () => {
    test('Usuario se logea correctamente', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'f.alonso' }),
      } as Response)
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/login', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nom_usuario: 'f.alonso',
            contrasena: 'Renault123$',
          }),
        })
        expect(mockOnSuccess).toHaveBeenCalledWith({"nom_usuario": "f.alonso"})
      })
    })

    test('limpia el error previo al iniciar sesión exitosamente', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn()

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      // Primer intento sin campos
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))
      await waitFor(() => {
        expect(screen.getByText(/por favor, rellena todos los campos\./i)).toBeTruthy()
      })

      // Segundo intento con datos válidos
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'f.alonso' }),
      } as Response)
      global.fetch = mockFetch

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.queryByText(/por favor, rellena todos los campos\./i)).not.toBeTruthy()
      })
    })
  })

  describe('Errores de lógica', () => {
    test('muestra error cuando la contraseña es incorrecta', async () => {
      const user = userEvent.setup()
      const errorMessage = 'Contraseña incorrecta'
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: errorMessage }),
      } as Response)
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'contraseñaIncorrecta')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(errorMessage)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })

    test('muestra error cuando el usuario no existe', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: 'Usuario no encontrado' }),
      } as Response)
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'usuarioIncorrecto')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/usuario no encontrado/i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Error de conexión', () => {
    test('muestra error cuando no se puede conectar al servidor', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockRejectedValueOnce(new Error('Network error'))
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(screen.getByText(/no se pudo conectar con el servidor de usuarios\./i)).toBeTruthy()
      })
      expect(mockOnSuccess).not.toHaveBeenCalled()
    })
  })

  describe('Funcionalidad', () => {
    test('desactiva el botón de login mientras se procesa el login', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ nom_usuario: 'f.alonso' }),
          } as Response)
        }, 100))
      )
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      expect(submitButton).toBeDisabled()

      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })

    test('muestra texto de carga en el botón durante el login', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(() => {
          resolve({
            ok: true,
            json: async () => ({ nom_usuario: 'f.alonso' }),
          } as Response)
        }, 100))
      )
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')

      const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
      await user.click(submitButton)

      expect(screen.getByRole('button', { name: /iniciando sesión\.\.\./i })).toBeTruthy()
    })
  })

  describe('Comprobación del estado inicial', () => {
    test('no muestra error cuando el formulario se carga por primera vez', () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      expect(screen.queryByText(/error|por favor/i)).not.toBeTruthy()
    })
  })

  describe('Envío de datos al servidor', () => {
    test('envía la información que espera el backend', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'f.alonso' }),
      } as Response)
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        const callArgs = mockFetch.mock.calls[0]
        const body = JSON.parse(callArgs[1].body)
        expect(body).toHaveProperty('nom_usuario')
        expect(body).toHaveProperty('contrasena')
      })
    })

    test('hace petición POST al endpoint correcto', async () => {
      const user = userEvent.setup()
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ nom_usuario: 'f.alonso' }),
      } as Response)
      global.fetch = mockFetch

      render(<LogInForm onLoginSuccess={mockOnSuccess} />)

      await user.type(screen.getByLabelText(/nombre de usuario/i), 'f.alonso')
      await user.type(screen.getByLabelText(/contraseña/i), 'Renault123$')
      await user.click(screen.getByRole('button', { name: /iniciar sesión/i }))

      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/login',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
        )
      })
    })

    test('el campo para introducir contraseña tiene tipo password', () => {
      render(<LogInForm onLoginSuccess={mockOnSuccess} />)
      const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement
      expect(passwordInput.type).toBe('password')
    })
  })
})
