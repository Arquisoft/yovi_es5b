import { Given, When, Then } from '@cucumber/cucumber'
import { expect } from '@playwright/test'

// Helper reutilizable: registra un usuario y deja la sesión iniciada en el lobby
async function registrarYAccederAlLobby(page, nombre, nom_usuario, password) {
  await page.goto('http://localhost:5173')
  await page.fill('#fullName', nombre)
  await page.fill('#username', nom_usuario)
  await page.fill('#password', password)
  await page.click('.submit-button')
  await page.waitForSelector('.lobby-main')
}

async function loginYAccederAlLobby(page, nom_usuario, password) {
  await page.goto('http://localhost:5173')
  await page.click('.login-page-button')
  await page.fill('#login-username', nom_usuario)
  await page.fill('#login-password', password)
  await page.click('.submit-button')
  await page.waitForSelector('.lobby-main')
}

// Respuesta mock que devuelve el servidor de gamey cuando el jugador gana.
// winner: 0 → jugador B (humano) ha ganado.
const MOCK_VICTORIA = {
  api_version: 'v1',
  bot_id: 'random_bot',
  coords: { x: 0, y: 1, z: 0 },
  status: { Finished: { winner: 0 } }
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
  await loginYAccederAlLobby(page, nom_usuario, 'test123...')
  await page.click('.btn-play')
  await page.waitForSelector('svg')
})

When('Hago clic en una casilla vacía del tablero', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Primera casilla gris (vacía) del tablero
  const casilla = page.locator('svg polygon[fill="#eeeeee"]').first()
  // Guardamos su atributo points para poder volver a localizarla en el Then
  this.puntosCasilla = await casilla.getAttribute('points')
  await casilla.click()
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
  await page.locator('button', { hasText: 'Abandonar Partida' }).click()
  await page.waitForSelector('.lobby-container')
})

Then('Debería volver al lobby con el botón JUGAR visible', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await expect(page.locator('.btn-play')).toHaveText('JUGAR')
})

// ─────────────────────────────────────────────────────────────────────────────
// Scenario: Detectar la victoria del jugador
// Scenario: Intentar seleccionar una casilla ya ocupada
//
// Ambos usan page.route() para interceptar la llamada al servidor Rust y
// devolver directamente un estado Finished, sin depender de la red ni de
// jugar una partida entera.
// ─────────────────────────────────────────────────────────────────────────────

Given('Estoy en una partida en curso como {string} con el servidor de juego simulado que devuelve victoria', async function (nom_usuario) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  await loginYAccederAlLobby(page, nom_usuario, 'test123...')

  // Interceptamos todas las peticiones al endpoint de gamey antes de entrar al juego
  await page.route('**/v1/ybot/choose/**', async route => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_VICTORIA)
    })
  })

  await page.click('.btn-play')
  await page.waitForSelector('svg')
})

Then('Debería mostrarse el mensaje de victoria y el botón de volver a jugar', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // El párrafo de estado debe mostrar el mensaje de victoria del jugador
  const mensajeVictoria = page.locator('p', { hasText: '¡HAS GANADO LA PARTIDA!' })
  await expect(mensajeVictoria).toBeVisible()
  // Debe aparecer el botón para reiniciar la partida
  const botonVolver = page.locator('button', { hasText: 'Volver a jugar' })
  await expect(botonVolver).toBeVisible()
})

// ─── Step compartido del escenario de casilla ocupada ────────────────────────

Then('And Intento hacer clic de nuevo en esa misma casilla', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Localizamos de nuevo la casilla por sus puntos (ahora tendrá fill azul o rojo)
  const casillaOcupada = page.locator(`svg polygon[points="${this.puntosCasilla}"]`)
  // Guardamos cuántas piezas azules hay antes del segundo clic
  this.azulesAntes = await page.locator('svg polygon[fill="#3b82f6"]').count()
  await casillaOcupada.click()
})

When('Intento hacer clic de nuevo en esa misma casilla', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  const casillaOcupada = page.locator(`svg polygon[points="${this.puntosCasilla}"]`)
  this.azulesAntes = await page.locator('svg polygon[fill="#3b82f6"]').count()
  await casillaOcupada.click()
})

Then('El número de piezas azules en el tablero no debería haber aumentado', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  // Esperamos un momento por si el clic hubiera disparado alguna llamada asíncrona
  await page.waitForTimeout(500)
  const azulesDespues = await page.locator('svg polygon[fill="#3b82f6"]').count()
  expect(azulesDespues).toBe(this.azulesAntes)
})