import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import PlayPage from './PlayPage';
import '../css/Estilo.css'; 
import Estadisticas from './Estadisticas.tsx';

interface GamePageProps {
  user: User;
}

const GamePage: React.FC<GamePageProps> = ({ user }) => {
  
  // Estado para la salud del microservicio de juego (Puerto 4000)
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  // Controlan qué vista mostrar (Partida, Estadísticas o Menú)
  const [playGame, setPlayGame] = useState(false);
  const [viewStats, setViewStats] = useState(false);
  
// botId guardará el nombre del archivo (sin .rs) que usará gamey
  const [botId, setBotId] = useState("random_bot");
  const [strategy, setStrategy] = useState('random_bot');
  const [size, setSize] = useState('15');

  useEffect(() => {
    // Función asíncrona para verificar si el servidor de juegos está en línea
    const checkGameyStatus = async () => {
      try {
        const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
        const res = await fetch(`${GAMEY_URL}/status`);
        const data = await res.text();
        // Si el servidor responde "OK", el estado es 'ok', de lo contrario 'error'
        setGameyStatus(res.ok && data.trim() === 'OK' ? 'ok' : 'error');
      } catch (err) {
        console.error("Error conectando con Gamey:", err);
        setGameyStatus('error');
      }
    };
    checkGameyStatus();
    // Crea un temporizador para re-comprobar la conexión cada 5 segundos
    const interval = setInterval(checkGameyStatus, 5000);
    // Limpieza del intervalo al desmontar el componente para evitar fugas de memoria
    return () => clearInterval(interval);
  }, []);

  // Inicia la partida guardando la estrategia actual y cambiando de vista
  const handleStartGame = () => {
      setBotId(strategy);
      setPlayGame(true);
  };

  // Función callback para que PlayPage pueda volver al menú principal
  const handleBackToLobby = () => setPlayGame(false);

  // Forza la recarga al inicio para resetear la sesión del usuario
  const handleLogout = () => {
    window.location.href = '/'; 
  };

  // Renderizado condicional: Prioridad 1 - La pantalla de juego
  if (playGame) {
      return <PlayPage botId={botId} user={user} onBackToLobby={handleBackToLobby}/>;
  }

  // Renderizado condicional: Prioridad 2 - La pantalla de estadísticas
  if (viewStats) {
    return <Estadisticas user={user} onBack={() => setViewStats(false)} />;
  }

  // Renderizado por defecto: El Menú Principal (Lobby)
  return (
    <div className="lobby-container">
      <header className="lobby-header">
        {/* Badge dinámico que cambia de color según el estado del servidor */}
        <div className={`status-badge ${gameyStatus}`}>
           {gameyStatus === 'ok' ? 'Conectado' : 'Desconectado'}
        </div>
        
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={() => setViewStats(true)} className="btn-secondary">
            Estadísticas
          </button>
          <button onClick={handleLogout} className="btn-logout">
            Salir
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <h1>Juego Y</h1>
        <p>Bienvenido, <strong>{user.nombre}</strong></p>

        <div className="selectors-container">
          {/* Selectores vinculados a los estados locales para configurar la partida */}
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="lobby-select">
            <option value="random">Bot Aleatorio</option>
            <option value="mediumbot">Bot Medio</option>
          </select>

          <select value={size} onChange={(e) => setSize(e.target.value)} className="lobby-select">
            <option value="15">15x15</option>
            <option value="30">30x30</option>
          </select>

          <button 
            onClick={handleStartGame} 
            className="btn-play"
            // Deshabilita el botón si no hay conexión con el servidor de juegos
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