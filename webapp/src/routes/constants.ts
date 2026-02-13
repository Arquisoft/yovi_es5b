// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  GAME: '/game/:username',
  GAME_PATH: (username: string) => `/game/${username}`,
} as const;
