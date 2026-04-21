import { useState } from 'react';
import { Board } from '../components/Board'; 
import type { User } from "../types/user";
import '../css/Estilo.css';

// Mantén tus diccionarios de mapeo
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
    onBackToLobby: () => void;
};

const PlayPage = ({ user, botId, boardSize, onBackToLobby }: PlayPageProps) => {
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
        <h2>Partida de: <strong>{user.nom_usuario || "Jugador"}</strong></h2>
        
        <div className="header-actions">
          <select 
            value={difficulty} 
            onChange={handleChangeDifficulty}
          >
            <option value="easy">Dificultad: Fácil</option>
            <option value="medium">Dificultad: Medio</option>
            <option value="hard">Dificultad: Difícil</option>
          </select>
          
          <button 
            onClick={handleAbandon}
            className="btn-logout"
          >
            Abandonar Partida
          </button>
        </div>
      </div>
      
      <p className="turn-indicator">Es tu turno. Selecciona una casilla del tablero.</p>

      <div key={gameKey}  className="card board-container">
        <Board botId={botId} difficulty={difficulty} boardSize={boardSize}/>
      </div>

        <div>
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
