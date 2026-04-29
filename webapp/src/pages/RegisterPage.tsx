import { useState } from "react";
import GamePage from "../pages/GamePage";
import RegisterForm from "../components/forms/RegisterForm";
import LogInForm from "../components/forms/LogInForm";
import "../css/Estilo.css"; 
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { normalizeLanguage, setStoredLanguage } from '../i18n/storage';

import type {User} from "../types/user";

const RegisterPage = () => {

  const [user, setUser] = useState<User | null>(null); // Almacena el usuario tras autenticarse
  const { t } = useTranslation();
  // Estado para alternar entre la vista de Registro e Inicio de Sesión
  const [isLogin, setIsLogin] = useState(false);

  //Manejador único para el éxito de ambos formularios, redirige al usuario a la ruta del juego pasando su nombre de usuario.
  const handleAuthSuccess = (data: User) => {
    setStoredLanguage(normalizeLanguage(i18n.language), data.nom_usuario);
    setUser(data); // Guarda los datos del usuario en el estado
  };

  // Si ya hay un usuario logueado, muestra la página del juego
  if (user !== null) {
      return <GamePage user={user}/>;
  }

  return (
    <div className="lobby-container">

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LanguageSelector selectClassName='combobox language-combobox' />
      </div>

      <h2>{t('auth.welcome')}</h2>

      {/* Selector de pestañas: Registro / Login */}
      <div className="auth-selector">
        <button
          onClick={() => setIsLogin(false)} // Cambia el estado para mostrar el formulario de registro
          className={`selector-button ${isLogin ? "" : "active"}`} // Se ilumina si no estamos en login
        >
          {t('auth.registerTab')}
        </button>
        <button
          onClick={() => setIsLogin(true)} // Cambia el estado para mostrar el inicio de sesión
          className={`login-page-button selector-button ${isLogin ? "active" : ""}`} // Se ilumina si estamos en modo login
        >
          {t('auth.loginTab')}
        </button>
      </div>
      <div className="card">
        <h3>{isLogin ? t('auth.loginTitle') : t('auth.registerTitle')}</h3>
        {isLogin ? (
          <LogInForm onLoginSuccess={handleAuthSuccess} />
        ) : (
          <RegisterForm onRegisterSuccess={handleAuthSuccess} />
        )}
      </div>
    </div>
  );
};

export default RegisterPage;
