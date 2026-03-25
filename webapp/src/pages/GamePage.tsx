import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import PlayPage from './PlayPage';
import '../css/Estilo.css'; 

interface GamePageProps {
  user: User;
}

const GamePage: React.FC<GamePageProps> = ({ user }) => {
  
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [playGame, setPlayGame] = useState(false);
  const [botId, setBotId] = useState("random_bot");
  const [strategy, setStrategy] = useState('random_bot');
  const [size, setSize] = useState('15');

  useEffect(() => {
    const checkGameyStatus = async () => {
      try {
        const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
        const res = await fetch(`${GAMEY_URL}/status`);
        const data = await res.text();
        setGameyStatus(res.ok && data.trim() === 'OK' ? 'ok' : 'error');
      } catch (err) {
        console.error("Error conectando con Gamey:", err);
        setGameyStatus('error');
      }
    };
    checkGameyStatus();
    const interval = setInterval(checkGameyStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStartGame = () => {
      setBotId(strategy);
      setPlayGame(true);
  };

  const handleBackToLobby = () => setPlayGame(false);

  const handleLogout = () => {
    window.location.href = '/'; 
  };

  if (playGame) {
      return <PlayPage botId={botId} user={user} boardSize={Number(size)} onBackToLobby={handleBackToLobby}/>;
  }

  return (
    <div className="lobby-container">
      <header className="lobby-header">
        <div className={`status-badge ${gameyStatus}`}>
           {gameyStatus === 'ok' ? 'Conectado' : 'Desconectado'}
        </div>
        <button onClick={handleLogout} className="btn-logout">Salir</button>
      </header>

      <main className="lobby-main">
        <h1>Juego Y</h1>
        <p>Bienvenido, <strong>{user.nom_usuario}</strong></p>

        <div className="selectors-container">
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="lobby-select">
            <option value="random_bot">Bot Aleatorio</option>
            <option value="smart_bot">Bot Inteligente</option>
          </select>

          <select value={size} onChange={(e) => setSize(e.target.value)} className="lobby-select">
            <option value="15">15x15</option>
            <option value="30">30x30</option>
          </select>

          <button 
            onClick={handleStartGame} 
            className="btn-play"
            disabled={gameyStatus !== 'ok'}
          >
            JUGAR
          </button>
        </div>
      </main>
    </div>
  );
};

export default GamePage;