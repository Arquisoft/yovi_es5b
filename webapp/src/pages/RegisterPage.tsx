import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/constants';
import RegisterForm from '../components/RegisterForm';
import reactLogo from '../assets/react.svg'

const RegisterPage = () => {
  const navigate = useNavigate();

  const handleRegisterSuccess = (username: string) => {
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

      <h2>Welcome to the Software Arquitecture 2025-2026 course</h2>
      <RegisterForm onRegisterSuccess={handleRegisterSuccess} />
    </div>
  );
};

export default RegisterPage;
