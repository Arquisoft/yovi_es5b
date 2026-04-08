import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { test, expect } from '@playwright/test';

Given('Acceso a la página de registro', async function () {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto('http://localhost:5173')
})

When('Relleno el formulario nombre de usuario como {string}, nombre {string}, contraseña {string} y pulso en Registrar', async function (nombre, nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.fill('#fullName', nombre)
  await page.fill('#username', nom_usuario)
  await page.fill('#password', password)
  await page.click('.submit-button')
})

Then('Debería haber creado mi cuenta de {string} y tener acceso a la pantalla de selección de juego', async function (nombre) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  // Buscar que el nombre de usuario aparece en el texto de bienvenida
  const lobby = page.locator('.lobby-main');
  await expect(lobby).toHaveText(new RegExp(`Bienvenido,.*${nombre}`));
  // Buscar que el botón de jugar está presente
  const botonRegistrar = page.locator(".btn-play");
  await expect(botonRegistrar).toHaveText("JUGAR");
})
