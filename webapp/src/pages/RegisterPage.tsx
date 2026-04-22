import { useState } from "react";
import GamePage from "../pages/GamePage";
import RegisterForm from "../components/forms/RegisterForm";
import LogInForm from "../components/forms/LogInForm";
import "../css/Estilo.css"; 
import { useTranslation } from 'react-i18next';
import i18n from '../i18n';
import LanguageSelector from '../components/LanguageSelector';
import { setStoredLanguage } from '../i18n/storage';

import type {User} from "../types/user";

const RegisterPage = () => {
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  // Estado para alternar entre la vista de Registro e Inicio de Sesión
  const [isLogin, setIsLogin] = useState(false);

  //Manejador único para el éxito de ambos formularios, redirige al usuario a la ruta del juego pasando su nombre de usuario.
  const handleAuthSuccess = (data: User) => {
    setStoredLanguage(i18n.language.toLowerCase().startsWith('en') ? 'en' : 'es', data.nom_usuario);
    setUser(data);
  };

  if (user !== null) {
      return <GamePage user={user}/>;
  }

  return (
    <div className="App">

      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <LanguageSelector />
      </div>

      <h2>{t('auth.welcome')}</h2>

      {/* Selector de pestañas: Registro / Login */}
      <div className="auth-selector">
        <button
          onClick={() => setIsLogin(false)}
          className={`selector-button ${!isLogin ? "active" : ""}`}
        >
          {t('auth.registerTab')}
        </button>
        <button
          onClick={() => setIsLogin(true)}
          className={`login-page-button selector-button ${isLogin ? "active" : ""}`}
        >
          {t('auth.loginTab')}
        </button>
      </div>

      {/* Renderizado condicional basado en el estado isLogin */}
      {isLogin ? (
        <div className="card">
          <h3>{t('auth.loginTitle')}</h3>
          <LogInForm onLoginSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <div className="card">
          <h3>{t('auth.registerTitle')}</h3>
          <RegisterForm onRegisterSuccess={handleAuthSuccess} />
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
