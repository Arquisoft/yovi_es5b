import { useState } from "react";
import GamePage from "../pages/GamePage";
import RegisterForm from "../components/forms/RegisterForm";
import LogInForm from "../components/forms/LogInForm";
import "../css/Estilo.css"; 

import type {User} from "../types/user";

const RegisterPage = () => {
  const [user, setUser] = useState<User | null>(null); // Almacena el usuario tras autenticarse
  // Estado para alternar entre la vista de Registro e Inicio de Sesión
  const [isLogin, setIsLogin] = useState(false);

  //Manejador único para el éxito de ambos formularios, redirige al usuario a la ruta del juego pasando su nombre de usuario.
  const handleAuthSuccess = (data: User) => {
    setUser(data); // Guarda los datos del usuario en el estado
  };

  // Si ya hay un usuario logueado, muestra la página del juego
  if (user !== null) {
      return <GamePage user={user}/>;
  }

  return (
    <div className="lobby-container">

      <h2>Bienvenido a Yovi</h2>

      {/* Selector de pestañas: Registro / Login */}
      <div className="auth-selector">
        <button
          onClick={() => setIsLogin(false)} // Cambia el estado para mostrar el formulario de registro
          className={`selector-button ${!isLogin ? "active" : ""}`} // Se ilumina si NO estamos en login
        >
          Registrarse
        </button>
        <button
          onClick={() => setIsLogin(true)} // Cambia el estado para mostrar el inicio de sesión
          className={`login-page-button selector-button ${isLogin ? "active" : ""}`} // Se ilumina si  SÍ estamos en modo login
        >
          Iniciar Sesión
        </button>
      </div>

      <div className="card">
              <h3>{isLogin ? "Inicio de Sesión" : "Registro de Usuario"}</h3> {/* Título dinámico */}
              {isLogin ? (
                <LogInForm onLoginSuccess={handleAuthSuccess} /> // Muestra formulario de login
              ) : (
                <RegisterForm onRegisterSuccess={handleAuthSuccess} /> // Muestra formulario de registro
              )}
            </div>
            </div>
        );
      };

export default RegisterPage;
