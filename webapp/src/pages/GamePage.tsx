import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import PlayPage from './PlayPage';
import '../css/Estilo.css'; 
import Estadisticas from './Estadisticas.tsx';

interface GamePageProps {
  user: User;
}

const GamePage: React.FC<GamePageProps> = ({ user }) => {
  
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking'); // Estado de conexión con el servidor de juegos
  const [playGame, setPlayGame] = useState(false); // Controla si se muestra la pantalla de partida activa
  const [viewStats, setViewStats] = useState(false); // Controla si se muestra la pantalla de estadísticas
  
  const [botId, setBotId] = useState("random_bot"); // Almacena el bot definitivo para la partida
  const [strategy, setStrategy] = useState('random_bot'); // Almacena la selección temporal del usuario
  const [size, setSize] = useState('5'); // Almacena el tamaño del tablero elegido

  useEffect(() => {
    // Comprueba si el microservicio de juegos (puerto 4000) responde correctamente
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
    const interval = setInterval(checkGameyStatus, 5000); // Reintenta la conexión cada 5 segundos
    return () => clearInterval(interval); // Limpia el temporizador al cerrar el componente
  }, []);

  // Prepara la configuración seleccionada y lanza la vista de juego
  const handleStartGame = () => {
      setBotId(strategy);
      setPlayGame(true);
  };

  // Función para regresar al menú principal desde la partida
  const handleBackToLobby = () => setPlayGame(false);

  // Cierra la sesión borrando la cookie y recargando la página
  const handleLogout = () => {
    document.cookie = "JSESSIONID=";
    window.location.href = '/'; 
  };

  // Renderizado de la pantalla de juego (PlayPage)
  if (playGame) {
      return <PlayPage botId={botId} user={user} boardSize={Number(size)} onBackToLobby={handleBackToLobby}/>;
  }

  // Renderizado de la pantalla de estadísticas
  if (viewStats) {
    return <Estadisticas user={user} onBack={() => setViewStats(false)} />;
  }

  // Renderizado del Menú Principal (Lobby)
  return (
    <div>
      <header>
        {/* Indicador visual del estado del servidor */}
        <div className={`status-badge ${gameyStatus}`}>
           {gameyStatus === 'ok' ? 'Conectado' : 'Desconectado'}
        </div>
        
        <div className="auth-selector"> {/* Contenedor para agrupar botones de acción */}
          <button onClick={() => setViewStats(true)} className="selector-button">
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

        <div className="register-form">
          {/* Selección del tipo de oponente (Bot) */}
          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="combobox">
            <option value="random">Bot Aleatorio</option>
            <option value="mediumbot">Bot Medio</option>
            <option value="bridgebot">Bot Puente (Difícil)</option>
          </select>

          {/* Selección de las dimensiones del tablero */}
          <select value={size} onChange={(e) => setSize(e.target.value)} className="combobox">
            <option value="5">Tablero pequeño</option>
            <option value="10">Tablero mediano</option>
            <option value="15">Tablero grande</option>
          </select>

          {/* Botón para iniciar partida, bloqueado si el servidor está caído */}
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