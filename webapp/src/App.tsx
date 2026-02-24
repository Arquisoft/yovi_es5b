import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes/constants';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<RegisterPage />} />
        <Route path={ROUTES.GAME} element={<GamePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;