import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { test, expect } from '@playwright/test';

Given('Me he registrado con nombre {string}, usuario {string} y contraseña {string} y accedo a la página de inicio de sesión', async function (nombre, nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.goto('http://localhost:5173')
  await page.fill('#fullName', nombre)
  await page.fill('#username', nom_usuario)
  await page.fill('#password', password)
  await page.click('.submit-button')
  // Tras registrarse, cerrar sesión e ir a la página de inicio de sesión
  await page.click('.btn-logout')
  await page.click('.login-page-button')
})

When('Relleno el formulario de inicio de sesión con las credenciales correctas {string} {string} y pulso en Iniciar sesión', async function (nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.fill('#login-username', nom_usuario)
  await page.fill('#login-password', password)
  await page.click('.submit-button')
})

Then('Debería mostrarme la página de juego para mi usuario {string}', async function (nombre) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  // Buscar que el nombre de usuario aparece en el texto de bienvenida
  const lobby = page.locator('.lobby-main');
  await expect(lobby).toHaveText(new RegExp(`Bienvenido,.*${nombre}`));
  // Buscar que el botón de jugar está presente
  const botonRegistrar = page.locator(".btn-play");
  await expect(botonRegistrar).toHaveText("JUGAR");
})
