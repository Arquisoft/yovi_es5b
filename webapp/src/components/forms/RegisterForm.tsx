import React, { useState } from 'react';
import '../../css/Estilo.css'; // Importación de los estilos relegados al fichero CSS
import { useTranslation } from 'react-i18next';
import { translateApiError, type ApiErrorPayload } from '../../utils/i18n/errorTranslator';

interface RegisterFormProps {
  // Callback para comunicar al componente padre que el registro fue exitoso
  onRegisterSuccess: (data: User) => void;
}

import type {User} from "../../types/user";

type FormErrorState =
  | { kind: 'i18n-key'; key: string }
  | { kind: 'api'; payload: ApiErrorPayload }
  | null;

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const { t } = useTranslation();

  //Estados del formulario
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Estados auxiliares para feedback visual y errores
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

  //Manejador del envío del formulario, se marca como 'async' porque realiza una petición de red (fetch).
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Evita que la página se recargue al enviar
    setErrorState(null);    // Limpiamos errores previos

    //Antes de ir al servidor, comprobamos que no haya campos vacíos
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setErrorState({ kind: 'i18n-key', key: 'errors.requiredFields' });
      return;
    }

    //Veririfca que la contraseña en introducir y repetir coinciden
    if (password !== confirmPassword) {
      setErrorState({ kind: 'i18n-key', key: 'errors.passwordMismatch' });
      setLoading(false);
      return;
    }

    setLoading(true); // Bloqueamos el botón para evitar múltiples clics

    try {
      //Enviamos los datos al puerto 3000 donde corre el microservicio de usuarios.
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
      const response = await fetch(`${USERS_URL}/register`, {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        //Convertimos las variables de React a los nombres que espera el backend (nombre, nom_usuario, contrasena)
        body: JSON.stringify({
          nombre: fullName,      
          nom_usuario: username, 
          contrasena: password   
        }),
      });

      const data = await response.json();

      if (response.ok) {
        //Si se ha registrado correctamente, informamos al componente padre del éxito del registro.
        onRegisterSuccess(data);
      } else {
        //El backend rechazó la petición
        setErrorState({ kind: 'api', payload: data as ApiErrorPayload });
      }
    } catch (err) {
      //Se lanza error si no se pudo alcanzar el servidor 
      console.error("Error de conexión:", err);
      setErrorState({ kind: 'i18n-key', key: 'errors.connectionUsers' });
    } finally {
      setLoading(false); // Liberamos el estado de carga
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/*Nombre Completo */}
      <div className="form-group">
        <label htmlFor="fullName">{t('auth.fullName')}:</label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-input"
        />
      </div>

      {/*Nombre de Usuario */}
      <div className="form-group">
        <label htmlFor="username">{t('auth.username')}:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>

      {/*Contraseña */}
      <div className="form-group">
        <label htmlFor="password">{t('auth.password')}:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">{t('auth.confirmPassword')}:</label>
        <input
          type="password"
          id="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Muestra de errores dinámicos usando la clase del CSS externo */}
      {errorMessage && <div className="error-message">{errorMessage}</div>}

      {/* Botón de acción con estado de carga */}
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? t('auth.submitRegisterLoading') : t('auth.submitRegister')}
      </button>
    </form>
  );
};

export default RegisterForm;
