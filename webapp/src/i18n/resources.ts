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
