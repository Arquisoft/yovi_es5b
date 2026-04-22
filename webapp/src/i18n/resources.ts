// Diccionarios de traducción para i18next
export const resources = {
  es: {
    translation: {
      language: {
        label: 'Idioma',
        spanish: 'Español',
        english: 'Inglés'
      },
      auth: {
        welcome: 'Bienvenido a Yovi',
        registerTab: 'Registrarse',
        loginTab: 'Iniciar Sesión',
        loginTitle: 'Inicio de Sesión',
        registerTitle: 'Registro de Usuario',
        fullName: 'Nombre Completo',
        username: 'Nombre de Usuario',
        password: 'Contraseña',
        submitLogin: 'Iniciar Sesión',
        submitLoginLoading: 'Iniciando Sesión...',
        submitRegister: 'Aceptar Registro',
        submitRegisterLoading: 'Registrando...'
      },
      start: {
        loadingSession: 'Cargando sesión...'
      },
      lobby: {
        connected: 'Conectado',
        disconnected: 'Desconectado',
        stats: 'Estadísticas',
        logout: 'Salir',
        title: 'Juego Y',
        welcomeUser: 'Bienvenido, {{name}}',
        botRandom: 'Bot Aleatorio (Fácil)',
        botMedium: 'Bot Medio (Medio)',
        botBridge: 'Bot Puente (Difícil)',
        boardSmall: 'Tablero pequeño',
        boardMedium: 'Tablero mediano',
        boardLarge: 'Tablero grande',
        play: 'JUGAR',
        boardHelpLabel: 'Board:',
        boardHelpText: 'Pinche para seleccionar el tamaño del tablero, configurado mediante número de hexágonos',
        botHelpLabel: 'Bot:',
        botHelpText: 'Pinche para seleccionar el contra qué bot quieres jugar'
      },
      stats: {
        title: 'Estadísticas de {{name}}',
        loading: 'Cargando datos...',
        played: 'Partidas jugadas',
        won: 'Partidas ganadas',
        lost: 'Partidas perdidas',
        backToMenu: 'Volver al Menú'
      },
      play: {
        titlePrefix: 'Partida de:',
        defaultPlayer: 'Jugador',
        difficultyEasy: 'Dificultad: Fácil',
        difficultyMedium: 'Dificultad: Medio',
        difficultyHard: 'Dificultad: Difícil',
        abandon: 'Abandonar Partida',
        turnHelp: 'Es tu turno. Selecciona una casilla del tablero.',
        rulesTitle: 'Reglas del Juego Y',
        rulesTextBeforeHighlight: 'Pulsa un hexágono para rellenarlo de tu color. Debes intentar trazar una línea de tu color que logre conectar los tres bordes del triángulo que compone el tablero.',
        rulesTextHighlight: 'Los hexágonos de la esquina valen por los dos lados',
        rulesTextAfterHighlight: '.'
      },
      board: {
        yourTurn: 'Tu turno (Juegas con Azul)',
        won: '¡HAS GANADO LA PARTIDA!',
        lost: 'El Bot te ha ganado...',
        thinking: 'El bot está pensando...',
        playAgain: 'Volver a jugar',
        requestBotError: 'Error en el servidor al pedir movimiento al bot: {{bot}}. Revisa la consola.',
        logs: {
          botMissingCoords: 'El bot devolvió una respuesta válida pero sin coordenadas.',
          serverError: 'Error del servidor ({{status}}):',
          requestBotFailed: 'Error al contactar con el bot:',
          matchSaved: 'Partida guardada en la base de datos correctamente.',
          matchSaveError: 'Error al guardar la partida ({{status}}):',
          matchSaveFailed: 'Error al guardar la partida en BD:'
        }
      },
      errors: {
        requiredFields: 'Por favor, rellena todos los campos.',
        connectionUsers: 'No se pudo conectar con el servidor de usuarios.',
        generic: 'Ha ocurrido un error.',
        codes: {
          AUTH_INVALID_CREDENTIALS: 'Credenciales incorrectas.',
          REGISTER_FAILED: 'No se pudo completar el registro.',
          LOGIN_FAILED: 'No se pudo iniciar sesión.',
          USER_NAME_INVALID: 'El nombre debe tener entre 4 y 30 caracteres.',
          USERNAME_INVALID_LENGTH: 'El nick debe tener entre 4 y 30 caracteres.',
          USERNAME_TAKEN: 'El nick de usuario ya está en uso.',
          PASSWORD_TOO_SHORT: 'La contraseña debe tener al menos 8 caracteres.',
          VALIDATION_ERROR: 'Hay errores de validación en el formulario.',
          USER_NOT_AUTHENTICATED: 'No hay usuario autenticado.',
          USER_NOT_FOUND: 'Usuario no encontrado.',
          STATS_FETCH_FAILED: 'Error al obtener estadísticas.',
          MATCH_SAVE_FAILED: 'Error al guardar la partida.',
          MISSING_MATCH_PARAMS: 'Faltan parámetros requeridos para guardar la partida.',
          UNSUPPORTED_API_VERSION: 'Versión de API no soportada.',
          INVALID_YEN_FORMAT: 'Formato de posición de partida inválido.',
          BOT_NOT_FOUND: 'El bot seleccionado no está disponible.',
          GAME_ENGINE_ERROR: 'No se pudo procesar la jugada del bot.'
        }
      }
    }
  },
  en: {
    translation: {
      language: {
        label: 'Language',
        spanish: 'Spanish',
        english: 'English'
      },
      auth: {
        welcome: 'Welcome to Yovi',
        registerTab: 'Register',
        loginTab: 'Log In',
        loginTitle: 'Sign In',
        registerTitle: 'User Registration',
        fullName: 'Full Name',
        username: 'Username',
        password: 'Password',
        submitLogin: 'Log In',
        submitLoginLoading: 'Signing In...',
        submitRegister: 'Create Account',
        submitRegisterLoading: 'Registering...'
      },
      start: {
        loadingSession: 'Loading session...'
      },
      lobby: {
        connected: 'Connected',
        disconnected: 'Disconnected',
        stats: 'Statistics',
        logout: 'Log out',
        title: 'Y Game',
        welcomeUser: 'Welcome, {{name}}',
        botRandom: 'Random Bot (Easy)',
        botMedium: 'Medium Bot (Medium)',
        botBridge: 'Bridge Bot (Hard)',
        boardSmall: 'Small board',
        boardMedium: 'Medium board',
        boardLarge: 'Large board',
        play: 'PLAY',
        boardHelpLabel: 'Board:',
        boardHelpText: 'Click to select the board size, configured by number of hexagons',
        botHelpLabel: 'Bot:',
        botHelpText: 'Click to choose which bot you want to play against'
      },
      stats: {
        title: 'Statistics for {{name}}',
        loading: 'Loading data...',
        played: 'Games played',
        won: 'Games won',
        lost: 'Games lost',
        backToMenu: 'Back to Menu'
      },
      play: {
        titlePrefix: 'Game of:',
        defaultPlayer: 'Player',
        difficultyEasy: 'Difficulty: Easy',
        difficultyMedium: 'Difficulty: Medium',
        difficultyHard: 'Difficulty: Hard',
        abandon: 'Leave Game',
        turnHelp: 'It is your turn. Select a board cell.',
        rulesTitle: 'Y Game Rules',
        rulesTextBeforeHighlight: 'Click a hexagon to fill it with your color. You must try to draw a line of your color connecting the three edges of the triangle-shaped board.',
        rulesTextHighlight: 'Corner hexagons count for both sides',
        rulesTextAfterHighlight: '.'
      },
      board: {
        yourTurn: 'Your turn (You play Blue)',
        won: 'YOU WON THE GAME!',
        lost: 'The bot beat you...',
        thinking: 'The bot is thinking...',
        playAgain: 'Play again',
        requestBotError: 'Server error while requesting move from bot: {{bot}}. Check console.',
        logs: {
          botMissingCoords: 'The bot returned a valid response but without coordinates.',
          serverError: 'Server error ({{status}}):',
          requestBotFailed: 'Error contacting bot:',
          matchSaved: 'Game saved in database successfully.',
          matchSaveError: 'Error saving game ({{status}}):',
          matchSaveFailed: 'Error saving game in DB:'
        }
      },
      errors: {
        requiredFields: 'Please complete all fields.',
        connectionUsers: 'Could not connect to the user service.',
        generic: 'An error occurred.',
        codes: {
          AUTH_INVALID_CREDENTIALS: 'Invalid credentials.',
          REGISTER_FAILED: 'Could not complete registration.',
          LOGIN_FAILED: 'Could not log in.',
          USER_NAME_INVALID: 'Name must be between 4 and 30 characters.',
          USERNAME_INVALID_LENGTH: 'Username must be between 4 and 30 characters.',
          USERNAME_TAKEN: 'This username is already taken.',
          PASSWORD_TOO_SHORT: 'Password must be at least 8 characters.',
          VALIDATION_ERROR: 'There are validation errors in the form.',
          USER_NOT_AUTHENTICATED: 'No authenticated user found.',
          USER_NOT_FOUND: 'User not found.',
          STATS_FETCH_FAILED: 'Could not fetch statistics.',
          MATCH_SAVE_FAILED: 'Could not save the match.',
          MISSING_MATCH_PARAMS: 'Missing required parameters to save the match.',
          UNSUPPORTED_API_VERSION: 'Unsupported API version.',
          INVALID_YEN_FORMAT: 'Invalid game position format.',
          BOT_NOT_FOUND: 'Selected bot is not available.',
          GAME_ENGINE_ERROR: 'Could not process the bot move.'
        }
      }
    }
  }
} as const;
