import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import PlayPage from './PlayPage';
import '../css/Estilo.css';
import Estadisticas from './Estadisticas.tsx';
import LanguageSelector from '../components/LanguageSelector';
import { useTranslation } from 'react-i18next';

interface GamePageProps {
  user: User;
}

const GamePage: React.FC<GamePageProps> = ({ user }) => {
  const { t } = useTranslation();
  
  // Estado para la salud del microservicio de juego (Puerto 4000)
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  // Controlan qué vista mostrar (Partida, Estadísticas o Menú)
  const [playGame, setPlayGame] = useState(false);
  const [viewStats, setViewStats] = useState(false);

// botId es el nombre de bot de gamey
  const [botId, setBotId] = useState("random_bot");
  const [size, setSize] = useState('5');

  const [customSize, setCustomSize] = useState(7);
  const [showCustomSlider, setShowCustomSlider] = useState(false);

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
    globalThis.location.href = '/';
  };

  // Renderizado condicional: Prioridad 1 - La pantalla de juego
  if (playGame) {
      const effectiveBoardSize = size === 'custom' ? customSize : Number(size);
      return <PlayPage botId={botId} user={user} boardSize={effectiveBoardSize} gameMode={gameMode} player2Name={effectivePlayer2Name} onBackToLobby={handleBackToLobby}
                onChangeDifficulty={(botId: string) => setBotId(botId)}/>;
  }

  // Renderizado condicional: Prioridad 2 - La pantalla de estadísticas
  if (viewStats) {
    return <Estadisticas user={user} onBack={() => setViewStats(false)} />;
  }

  // Renderizado por defecto: El Menú Principal (Lobby)
  return (
    <div>
      <header className="lobby-container">
        {/* Badge dinámico que cambia de color según el estado del servidor */}
        <div className={`status-badge ${gameyStatus}`}>
            {gameyStatus === 'ok' ? t('lobby.connected') : t('lobby.disconnected')}
        </div>

        {/* Agrupamos botones con tu clase auth-selector para el layout */}
        <div className="auth-selector">
          <LanguageSelector username={user.nom_usuario} selectClassName="combobox language-combobox" />
          <button onClick={() => setViewStats(true)} className="selector-button">
            {t('lobby.stats')}
          </button>
          <button onClick={handleLogout} className="btn-logout">
            {t('lobby.logout')}
          </button>
        </div>
      </header>

      <main className="lobby-main">
        <h1>{t('lobby.title')}</h1>
        <p>{t('lobby.welcomeUser', { name: user.nombre })}</p>

        <div className="register-form">
          <select
            value={gameMode}
            onChange={(e) => setGameMode(e.target.value as 'bot' | 'pvp')}
            className="combobox"
          >
            <option value="bot">{t('lobby.modeBot')}</option>
            <option value="pvp">{t('lobby.modePvp')}</option>
          </select>

          {gameMode === 'pvp' && (
            <input
              type="text"
              placeholder={t('lobby.player2Placeholder')}
              value={player2Name}
              onChange={(e) => setPlayer2Name(e.target.value)}
              className="combobox combobox--player-name"
            />
          )}

          {gameMode === 'bot' && (
            <select
              value={botId}
              onChange={(e) => setBotId(e.target.value)}
              className="combobox"
            >
              <option value="random_bot">{t('lobby.botRandom')}</option>
              <option value="mirrorbot">{t('lobby.botMirror')}</option>
              <option value="lapabot">{t('lobby.botLapa')}</option>
              <option value="mediumbot">{t('lobby.botMedium')}</option>
              <option value="bridgebot_lax">{t('lobby.botBridgeLax')}</option>
              <option value="bridgebot">{t('lobby.botBridge')}</option>
            </select>
          )}

          <select
            value={size}
            onChange={(e) => {
              const val = e.target.value;
              setSize(val);
              setShowCustomSlider(val === 'custom');
            }}
            className="combobox"
          >
            <option value="5">{t('lobby.boardSmall')}</option>
            <option value="10">{t('lobby.boardMedium')}</option>
            <option value="15">{t('lobby.boardLarge')}</option>
            <option value="custom">{t('lobby.boardCustom')}</option>
          </select>

          {showCustomSlider && (
            <div className="board-custom-slider">
              <label className="board-custom-label" htmlFor="board-size-slider">
                {t('lobby.boardCustomLabel', { size: customSize })}
              </label>
              <input
                id="board-size-slider"
                type="range"
                min={3}
                max={25}
                value={customSize}
                onChange={(e) => setCustomSize(Number(e.target.value))}
                className="board-size-slider"
              />
              <div className="board-size-range">
                <span>3</span>
                <span>25</span>
              </div>
            </div>
          )}

          <button
            onClick={handleStartGame}
            className="btn-play"
            disabled={gameyStatus !== 'ok'}
          >
            {gameyStatus === 'ok' ? t('lobby.play') : t('lobby.withoutConexion')}
          </button>
        </div>

        <div className="info-section">
          <p>
            <strong>{t('lobby.boardHelpLabel')}</strong> {t('lobby.boardHelpText')}
          </p>
          <p>
            <strong>{t('lobby.botHelpLabel')}</strong> {t('lobby.botHelpText')}
          </p>
        </div>
      </main>
    </div>
  );
};

export default GamePage;
