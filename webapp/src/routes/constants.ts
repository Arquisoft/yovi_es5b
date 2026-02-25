// Rutas de la aplicación
export const ROUTES = {
  HOME: '/',
  GAME: '/game/:username',
  GAME_PATH: (username: string) => `/game/${username}`,

  PLAY: '/play/:username',
  PLAY_PATH: (username: string) => `/play/${username}`,
} as const;
