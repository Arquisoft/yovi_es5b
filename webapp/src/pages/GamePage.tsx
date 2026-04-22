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

// botId es el nombre de bot de gamey
  const [botId, setBotId] = useState("random_bot");
  const [size, setSize] = useState('5');
  // Modo de juego seleccionado en el lobby: 'bot' para jugar contra IA, 'pvp' para dos jugadores locales
  const [gameMode, setGameMode] = useState<'bot' | 'pvp'>('bot');
  // Nombre del segundo jugador en modo PvP; si se deja vacío se usará 'Invitado'
  const [player2Name, setPlayer2Name] = useState('');

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

  // Inicia la partida cambiando de vista
  const handleStartGame = () => {
      setPlayGame(true);
  };

  // Nombre efectivo del J2: usa lo que escribió el usuario o 'Invitado' si lo dejó en blanco
  const effectivePlayer2Name = player2Name.trim() || 'Invitado';

  // Función callback para que PlayPage pueda volver al menú principal
  const handleBackToLobby = () => setPlayGame(false);

  // Eliminar cookie de sesión
  const handleLogout = () => {
    document.cookie = "JSESSIONID="
    window.location.href = '/';
  };

  // Renderizado condicional: Prioridad 1 - La pantalla de juego
  if (playGame) {
      return <PlayPage botId={botId} user={user} boardSize={Number(size)} gameMode={gameMode} player2Name={effectivePlayer2Name} onBackToLobby={handleBackToLobby}
                onChangeDifficulty={(botId: string) => setBotId(botId)}/>;
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
          {/* Selector de modo de juego: permite elegir entre partida contra IA o contra otro jugador local */}
          <select value={gameMode} onChange={(e) => setGameMode(e.target.value as 'bot' | 'pvp')} className="lobby-select">
            <option value="bot">Jugador vs Bot</option>
            <option value="pvp">Jugador vs Jugador</option>
          </select>

          {/* Input para el nombre del J2: solo visible en modo PvP; si se deja vacío se usará 'Invitado' */}
          {gameMode === 'pvp' && (
            <input
              type="text"
              placeholder="Nombre del Jugador 2 (opcional)"
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              className="lobby-select"
            />
          )}

          {/* Selector de dificultad: solo se muestra en modo bot, ya que en PvP no hay IA */}
          {gameMode === 'bot' && (
            <select value={botId} onChange={(e) => setBotId(e.target.value)} id="botSelect" className="lobby-select">
              <option value="random">Bot Aleatorio (Fácil)</option>
              <option value="mediumbot">Bot Medio (Medio)</option>
              <option value="bridgebot">Bot Puente (Difícil)</option>
            </select>
          )}

          <select value={size} onChange={(e) => setSize(e.target.value)} className="lobby-select">
            <option value="5">Tablero pequeño</option>
            <option value="10">Tablero mediano</option>
            <option value="15">Tablero grande</option>
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

        <div>
          <p>
            <strong>Board:</strong> Pinche para seleccionar el tamaño del tablero, configurado mediante número de hexágonos
          </p>
        </div>
        <div>
          <p>
            <strong>Bot:</strong> Pinche para seleccionar el contra qué bot quieres jugar
          </p>
        </div>

      </main>
    </div>
  );
};

export default GamePage;
