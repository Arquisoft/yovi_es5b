import { render, screen,  waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import RegisterForm from '../components/forms/RegisterForm'
import { afterEach, describe, expect, test, vi } from 'vitest'
import '@testing-library/jest-dom'


describe('RegisterForm', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('shows validation error when username is empty', async () => {
    const mockOnSuccess = vi.fn()
    render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)
    const user = userEvent.setup()

    await waitFor(async () => {
      await user.click(screen.getByRole('button', { name: /lets go!/i }))
      expect(screen.getByText(/please enter a username/i)).toBeTruthy()
    })
  })

  test('submits username and displays response', async () => {
    const user = userEvent.setup()
    const mockOnSuccess = vi.fn()

    // Mock fetch to resolve automatically
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'Hello Pablo! Welcome to the course!' }),
    } as Response)

    render(<RegisterForm onRegisterSuccess={mockOnSuccess} />)

    // Wrap interaction + assertion inside waitFor
    await waitFor(async () => {
      await user.type(screen.getByLabelText(/whats your name?/i), 'Pablo')
      await user.click(screen.getByRole('button', { name: /lets go!/i }))

      // Response message should appear
      expect(
        screen.getByText(/hello pablo! welcome to the course!/i)
      ).toBeTruthy()
    })
  })
})
