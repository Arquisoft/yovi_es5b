import { useState } from 'react';
import { Board } from '../components/Board';
import type { User } from "../types/user";
import '../css/Estilo.css';

// Dificultades de los bots
type DifficultyLevel = 'easy' | 'medium' | 'hard';

const urlToDifficulty: Record<string, DifficultyLevel> = {
  'random_bot': 'easy',
  'mediumbot': 'medium',
  'bridgebot': 'hard',
};

type PlayPageProps = {
    user: User;
    botId: string;
    boardSize: number;
    // Modo de juego recibido del lobby: determina si se juega contra bot o contra otro jugador
    gameMode: 'bot' | 'pvp';
    // Nombre del segundo jugador en modo PvP (por defecto 'Invitado' si se dejó vacío en el lobby)
    player2Name: string;
    onBackToLobby: () => void;
};

const PlayPage = ({ user, botId, boardSize, gameMode, player2Name, onBackToLobby }: PlayPageProps) => {
  // Inicializa basándose en botId recibido como prop
  const initialDifficulty = urlToDifficulty[botId] || 'easy';
  // Estado para controlar la dificultad actual del bot
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  // Clave para forzar el re-renderizado del componente Board cuando cambie la dificultad
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = async () => {
    onBackToLobby();
  };

  // Handler que soporta las 3 dificultades
  const handleChangeDifficulty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel;
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1);
  };

  return (
    <div className="lobby-container">
      <div className="play-header">
        <h2 className="play-title">
          {gameMode === 'pvp'
            ? <><strong>{user.nom_usuario || 'Jugador 1'}</strong> vs <strong>{player2Name}</strong></>
            : <>Partida de: <strong>{user.nom_usuario || "Jugador"}</strong></>
          }
        </h2>

        <div className="auth-selector">
          {/* Solo mostramos el selector de dificultad si estamos en modo bot */}
          {gameMode === 'bot' && (
            <select 
              value={difficulty} 
              onChange={handleChangeDifficulty}
              className="combobox"
            >
              <option value="easy">Dificultad: Fácil</option>
              <option value="medium">Dificultad: Medio</option>
              <option value="hard">Dificultad: Difícil</option>
            </select>
          )}

          <button 
            onClick={handleAbandon}
            className="btn-logout"
          >
            Abandonar Partida
          </button>
        </div>
      </div>

      <p className="turn-indicator">
        {gameMode === 'pvp' 
          ? 'Los jugadores se turnan. Selecciona una casilla del tablero.' 
          : 'Es tu turno. Selecciona una casilla del tablero.'}
      </p>

      {/* Contenedor del tablero con tu clase card y la lógica de reset por key */}
      <div key={gameKey} className="card board-container">
        <Board 
          botId={botId} 
          difficulty={difficulty} 
          boardSize={boardSize} 
          gameMode={gameMode} 
          player1Name={user.nom_usuario || 'Jugador 1'} 
          player2Name={player2Name}
        />
      </div>

      <div className="info-section">
        <h3>Reglas del Juego Y</h3>
        <p>
          Pulsa un hexágono para rellenarlo de tu color. Debes intentar trazar una línea
          de tu color que logre conectar los tres bordes del triángulo
          que compone el tablero. <strong>Los hexágonos de la esquina valen por los dos lados</strong>.
        </p>
      </div>
    </div>
  );
};

export default PlayPage;