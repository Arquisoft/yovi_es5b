import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

// Helper reutilizable: registra un usuario y deja la sesión iniciada en el lobby
async function registrarYAccederAlLobby(page, nombre, nom_usuario, password) {
  await page.goto('http://localhost:5173')
  await page.fill('#fullName', nombre)
  await page.fill('#username', nom_usuario)
  await page.fill('#password', password)
  await page.click('.submit-button')
  // Esperamos a que aparezca el lobby tras el registro
  await page.waitForSelector('.lobby-main')
}

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Iniciar una partida correctamente
// ─────────────────────────────────────────────────────────────────────────────

Given('Me he registrado con nombre {string}, usuario {string} y contraseña {string} y accedo al lobby', async function (nombre, nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await registrarYAccederAlLobby(page, nombre, nom_usuario, password)
})

When('Selecciono la estrategia {string} y pulso en JUGAR', async function (estrategia) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Seleccionar la estrategia en el desplegable del lobby
  await page.selectOption('.lobby-select', { label: estrategia })
  await page.click('.btn-play')
  // Esperamos a que el tablero esté visible
  await page.waitForSelector('svg')
})

Then('Debería ver el tablero de juego con el mensaje de turno', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // El SVG del tablero debe estar presente
  const tablero = page.locator('svg')
  await expect(tablero).toBeVisible()
  // Debe mostrarse el mensaje indicando que es el turno del jugador
  const mensajeTurno = page.locator('p', { hasText: 'Es tu turno' })
  await expect(mensajeTurno).toBeVisible()
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Hacer un movimiento en el tablero
// ─────────────────────────────────────────────────────────────────────────────

Given('Estoy en una partida en curso como {string}', async function (nom_usuario) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Registramos al usuario y arrancamos una partida directamente
  await registrarYAccederAlLobby(page, 'Ana', nom_usuario, 'test123...')
  await page.click('.btn-play')
  await page.waitForSelector('svg')
})

When('Hago clic en una casilla vacía del tablero', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Hacemos clic en el primer polígono del SVG (primera casilla del tablero)
  const primeraCasilla = page.locator('svg polygon').first()
  await primeraCasilla.click()
  // Guardamos la referencia en el contexto para poder verificarla en el Then
  this.primeraCasilla = primeraCasilla
})

Then('Debería aparecer mi pieza en azul en esa casilla y el bot debería responder', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Tras el clic, esperamos a que el bot haya respondido (el indicador de "pensando" desaparece)
  await page.waitForFunction(() => {
    const p = document.querySelector('p[style]')
    return p && !p.textContent.includes('pensando')
  }, { timeout: 15000 })
  // Debe haber al menos una casilla azul (pieza del jugador, color #3b82f6)
  const casillasAzules = page.locator('svg polygon[fill="#3b82f6"]')
  await expect(casillasAzules).toHaveCount(1)
  // Debe haber al menos una casilla roja (pieza del bot, color #ef4444)
  const casillasRojas = page.locator('svg polygon[fill="#ef4444"]')
  await expect(casillasRojas).toHaveCount(1)
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Abandonar una partida y volver al lobby
// ─────────────────────────────────────────────────────────────────────────────

When('Pulso el botón de Abandonar Partida', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.click('button', { hasText: 'Abandonar Partida' })
})

Then('Debería volver al lobby con el botón JUGAR visible', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Debe volver a aparecer el lobby
  const lobby = page.locator('.lobby-main')
  await expect(lobby).toBeVisible()
  // El botón de JUGAR debe estar presente
  const botonJugar = page.locator('.btn-play')
  await expect(botonJugar).toHaveText('JUGAR')
})