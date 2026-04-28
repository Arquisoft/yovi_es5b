import React, { useState } from 'react';
import '../../css/Estilo.css'; 
import { useTranslation } from 'react-i18next';
import { translateApiError, type ApiErrorPayload } from '../../utils/i18n/errorTranslator';

interface LogInFormProps {
  //Notificamos al componente padre que las credenciales son válidas
  onLoginSuccess: (data: User) => void;
}

import type {User} from "../../types/user";

type FormErrorState =
  | { kind: 'i18n-key'; key: string }
  | { kind: 'api'; payload: ApiErrorPayload }
  | null;

const LogInForm: React.FC<LogInFormProps> = ({ onLoginSuccess }) => {
  const { t } = useTranslation();

  // Estados para capturar las credenciales del usuario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para manejar el feedback visual
  const [errorState, setErrorState] = useState<FormErrorState>(null);
  const [loading, setLoading] = useState(false);

  let errorMessage: string | null = null;
  if (errorState) {
    if (errorState.kind === 'i18n-key') {
      errorMessage = t(errorState.key);
    } else {
      errorMessage = translateApiError(errorState.payload, t);
    }
  }

  //Manejador del inicio de sesión, realiza una petición POST al microservicio de usuarios.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Evita la recarga de la página
    setErrorState(null);    // Limpia intentos anteriores

    //Antes de ir al servidor, comprobamos que no haya campos vacíos
    if (!username.trim() || !password.trim()) {
      setErrorState({ kind: 'i18n-key', key: 'errors.requiredFields' });
      return;
    }

    setLoading(true); // Desactiva el botón mientras esperamos respuesta

    try {
      //Enviamos los datos al puerto 3000 donde corre el microservicio de usuarios.
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      const response = await fetch(`${USERS_URL}/login`, {
        credentials: "include",
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_usuario: username, // Clave esperada por el validador del backend
          contrasena: password   // Clave esperada por el validador del backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        //Las credenciales son correctas y el backend ha generado la sesión.
        onLoginSuccess(data);
      } else {
        //Credenciales incorrectas o usuario no encontrado.
        setErrorState({ kind: 'api', payload: data as ApiErrorPayload });
      }
    } catch (err) {
      //Fallo en la red o servidor caído.
      console.error("Error en login:", err);
      setErrorState({ kind: 'i18n-key', key: 'errors.connectionUsers' });
    } finally {
      setLoading(false); // Restablece el estado del botón
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/* Campo de entrada para el usuario */}
      <div className="form-group">
        <label htmlFor="login-username">{t('auth.username')}:</label>
        <input
          type="text"
          id="login-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Campo de entrada para la contraseña */}
      <div className="form-group">
        <label htmlFor="login-password">{t('auth.password')}:</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Muestra de errores dinámicos con la clase CSS externa */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Botón de acción con feedback de estado */}
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? t('auth.submitLoginLoading') : t('auth.submitLogin')}
      </button>
    </form>
  );
};

export default LogInForm;
