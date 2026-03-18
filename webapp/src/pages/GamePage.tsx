import { useState, useEffect } from 'react';
import PlayPage from "../pages/PlayPage";

import type {User} from "../types/user";

type GamePageProps = {
    user: User;
};

const GamePage = ({user}: GamePageProps) => {
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [playGame, setPlayGame] = useState(false);
  const [botId, setBotId] = useState("random_bot");

  useEffect(() => {
    const checkGameyStatus = async () => {
      try {
        const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
        const res = await fetch(`${GAMEY_URL}/status`, {credentials: "include"});
        const data = await res.text();
        
        if (res.ok && data.trim() === 'OK') {
          setGameyStatus('ok');
        } else {
          setGameyStatus('error');
        }
      } catch (err) {
        console.error('Error checking Gamey status:', err);
        setGameyStatus('error');
      }
    };

    // Check immediately
    checkGameyStatus();

    // Check every 5 seconds
    const interval = setInterval(checkGameyStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const statusColor = gameyStatus === 'ok' ? '#22c55e' : gameyStatus === 'error' ? '#ef4444' : '#f59e0b';
  const statusText = gameyStatus === 'ok' ? '✓ Conectado' : gameyStatus === 'error' ? '✗ Desconectado' : '⏳ Verificando...';

  const handleStartGame = (botId: string) => {
      setPlayGame(true);
      setBotId(botId);
  };

  const handleBackToLobby = () => {
    setPlayGame(false);
  };

  if (playGame) {
      return <PlayPage botId={botId} user={user} onBackToLobby={handleBackToLobby}/>;
  }

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🎮 Juego Y</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          Bienvenido, <strong>{user.nombre}</strong>
        </p>
      </div>

      {/* Status Indicator Rectangle */}
      <div
        style={{
          width: '200px',
          height: '100px',
          margin: '0 auto 40px',
          backgroundColor: statusColor,
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '16px',
          fontWeight: 'bold',
          boxShadow: `0 4px 6px rgba(0, 0, 0, 0.1)`,
          transition: 'background-color 0.3s ease'
        }}
      >
        <span>{statusText}</span>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Estado del servidor Gamey: <strong>{gameyStatus === 'ok' ? 'En línea' : gameyStatus === 'error' ? 'Fuera de línea' : 'Verificando...'}</strong>
        </p>
      </div>

      <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '30px' }}>
        <div style={{ display: 'flex', gap: '10px', marginTop: '20px' }}>
          <button 
            onClick={() => handleStartGame('random_bot')}
            style={{ padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
          >
            Jugar contra Aleatorio (Fácil)
          </button>
        </div>
      </div>
    </div>
  );
};

export default GamePage;
