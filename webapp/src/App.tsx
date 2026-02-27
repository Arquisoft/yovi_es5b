import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ROUTES } from './routes/constants';
import RegisterPage from './pages/RegisterPage';
import GamePage from './pages/GamePage';
import PlayPage from './pages/PlayPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.HOME} element={<RegisterPage />} />
        <Route path={ROUTES.GAME} element={<GamePage />} />
        <Route path={ROUTES.PLAY} element={<PlayPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
