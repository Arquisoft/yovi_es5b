export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    GAME_PATH: (username: string) => `/game/${username}`,
    PLAY_PATH: (username: string) => `/play/${username}`,
    STATS_PATH: (username: string) => `/stats/${username}`,
};