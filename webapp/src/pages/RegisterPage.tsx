import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../routes/constants";
import RegisterForm from "../components/RegisterForm";
import reactLogo from "../assets/react.svg";
import LogInForm from "../components/LogInForm";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(false);

  const handleAuthSuccess = (username: string) => {
    navigate(ROUTES.GAME_PATH(username));
  };

  return (
    <div className="App">
      <div>
        <a href="https://vitejs.dev" target="_blank" rel="noreferrer">
          <img src="/vite.svg" className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank" rel="noreferrer">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>

      <h2>Welcome to the Software Architecture 2025-2026 course</h2>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setIsLogin(false)}
          style={{
            fontWeight: !isLogin ? "bold" : "normal",
            marginRight: "10px",
          }}
        >
          Registrarse
        </button>
        <button
          onClick={() => setIsLogin(true)}
          style={{ fontWeight: isLogin ? "bold" : "normal" }}
        >
          Iniciar Sesión
        </button>
      </div>

      {isLogin ? (
  <div className="card">
    <h3>Inicio de Sesión</h3>
    <LogInForm onLoginSuccess={handleAuthSuccess} />
  </div>
) : (
  /* AQUÍ ESTABA EL CAMBIO: añadimos el div con clase "card" */
  <div className="card">
    <h3>Registro de Usuario</h3>
    <RegisterForm onRegisterSuccess={handleAuthSuccess} />
  </div>
)}
    </div>
  );
};

export default RegisterPage;
