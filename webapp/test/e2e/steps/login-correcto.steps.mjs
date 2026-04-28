import { Given, When, Then } from '@cucumber/cucumber'
import assert from 'assert'
import { test, expect } from '@playwright/test';

let usuarioCreado;

// Función auxiliar para saltar la pantalla de bienvenida
async function superarBienvenida(page) {
  await page.waitForSelector('text=Cargando sesión...', { state: 'detached', timeout: 10000 });
  const botonComenzar = page.locator('.btn-enter');
  await botonComenzar.waitFor({ state: 'visible' });
  await botonComenzar.click({ force: true });
}

Given('Me he registrado con nombre {string}, usuario {string} y contraseña {string} y accedo a la página de inicio de sesión', async function (nombre, nom_usuario, password) {
  const page = this.page;
  if (!page) throw new Error('Page not initialized');
    usuarioCreado = nom_usuario + new Date().valueOf();
  await page.goto('http://localhost:5173');
  await superarBienvenida(page);
  await page.fill('#fullName', nombre);
  await page.fill('#username', usuarioCreado); 
  await page.fill('#password', password);
  
  await page.fill('#confirmPassword', password);
  await page.click('.submit-button');
  // Tras registrarse, cerrar sesión e ir a la página de inicio de sesión
  // Esperamos a entrar al lobby para confirmar éxito y luego cerramos sesión
  await page.waitForSelector('.btn-logout', { timeout: 10000 });
  await page.click('.btn-logout');

  // Volvemos a entrar para ir al LOGIN
  await superarBienvenida(page);
  await page.click('.login-page-button'); 
})

When('Relleno el formulario de inicio de sesión con las credenciales correctas {string} {string} y pulso en Iniciar sesión', async function (nom_usuario, password) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')
  await page.fill('#login-username', usuarioCreado)
  await page.fill('#login-password', password)
  await page.click('.submit-button')
})

Then('Debería mostrarme la página de juego para mi usuario {string}', async function (nombre) {
  const page = this.page
  if (!page) throw new Error('Page not initialized')

  // Buscar que el nombre de usuario aparece en el texto de bienvenida
  const lobby = page.locator('.lobby-main');

  await expect(lobby).toBeVisible({ timeout: 10000 });

  await expect(lobby).toHaveText(new RegExp(`Bienvenido,.*${nombre}`));
  // Buscar que el botón de jugar está presente
  const botonJugar = page.locator(".btn-play"); 
  await expect(botonJugar).toBeVisible();
})
