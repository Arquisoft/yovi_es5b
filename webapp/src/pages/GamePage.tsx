import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/constants';

const GamePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');

  useEffect(() => {
    const checkGameyStatus = async () => {
      try {
        const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
        const res = await fetch(`${GAMEY_URL}/status`);
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

  const handleBack = () => {
    navigate(ROUTES.HOME);
  };

  const handleStartGame = () => {
    navigate(ROUTES.PLAY_PATH(username || ''));
  };

  return (
    <div style={{ padding: '40px', textAlign: 'center' }}>
      <h1>🎮 Juego Y</h1>
      
      <div style={{ marginBottom: '40px' }}>
        <p style={{ fontSize: '18px', marginBottom: '10px' }}>
          Bienvenido, <strong>{username}</strong>
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
        <button
          onClick={handleBack}
          style={{
            padding: '10px 20px',
            backgroundColor: '#6b7280', // He puesto un color grisáceo para el botón de volver
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '14px',
          }}
        >
          ← Volver
        </button>

        <button
          onClick={handleStartGame}
          disabled={gameyStatus !== 'ok'} // Se desactiva si el servidor no está listo
          style={{
            padding: '10px 20px',
            backgroundColor: gameyStatus === 'ok' ? '#3b82f6' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: gameyStatus === 'ok' ? 'pointer' : 'not-allowed',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          Empezar Partida 🚀
        </button>
      </div>
    </div>
  );
};

export default GamePage;
