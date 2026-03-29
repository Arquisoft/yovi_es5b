import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { test, expect } from '@playwright/test';

Given('Acceso a la página de inicio de sesión', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto('http://localhost:5173')
  await page.click('.login-page-button')
})

When('Relleno el formulario de inicio de sesión con credenciales no válidas como {string} {string} y pulso en Iniciar sesión', async function (nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.fill('#login-username', nom_usuario)
  await page.fill('#login-password', password)
  await page.click('.submit-button')
})

Then('Debería mostrarme un error que indique claramente que no he podido iniciar sesión porque los datos son incorrectos', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  // Buscar que el nombre de usuario aparece en el texto de bienvenida
  const lobby = page.locator('.error-message');
  await expect(lobby).toHaveText("Error al iniciar sesión. Credenciales no válidas.");
})
