import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/constants";
import RegisterForm from "../components/forms/RegisterForm";
import LogInForm from "../components/forms/LogInForm";
import "../css/Estilo.css"; 

const RegisterPage = () => {
  const navigate = useNavigate();
  // Estado para alternar entre la vista de Registro e Inicio de Sesión
  const [isLogin, setIsLogin] = useState(false);

  //Manejador único para el éxito de ambos formularios, redirige al usuario a la ruta del juego pasando su nombre de usuario.
  const handleAuthSuccess = (username: string) => {
    navigate(ROUTES.GAME_PATH(username));
  };

  return (
    <div className="App">

      <h2>Bienvenido a Yovi</h2>

      {/* Selector de pestañas: Registro / Login */}
      <div className="auth-selector">
        <button
          onClick={() => setIsLogin(false)}
          className={`selector-button ${!isLogin ? "active" : ""}`}
        >
          Registrarse
        </button>
        <button
          onClick={() => setIsLogin(true)}
          className={`selector-button ${isLogin ? "active" : ""}`}
        >
          Iniciar Sesión
        </button>
      </div>

      {/* Renderizado condicional basado en el estado isLogin */}
      {isLogin ? (
        <div className="card">
          <h3>Inicio de Sesión</h3>
          <LogInForm onLoginSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <div className="card">
          <h3>Registro de Usuario</h3>
          <RegisterForm onRegisterSuccess={handleAuthSuccess} />
        </div>
      )}
    </div>
  );
};

export default RegisterPage;
