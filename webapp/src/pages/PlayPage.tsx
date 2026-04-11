import { useState } from 'react';
import { Board } from '../components/Board';
import type { User } from "../types/user";

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
    // Modo de juego recibido del lobby: determina si se juega contra bot o contra otro jugador
    gameMode: 'bot' | 'pvp';
    // Nombre del segundo jugador en modo PvP (por defecto 'Invitado' si se dejó vacío en el lobby)
    player2Name: string;
    onBackToLobby: any;
};

const PlayPage = ({ user, botId, boardSize, gameMode, player2Name, onBackToLobby }: PlayPageProps) => {
  // Inicializa basándose en botId recibido como prop
  const initialDifficulty = urlToDifficulty[botId] || 'easy';
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
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
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>
          {gameMode === 'pvp'
            ? <><strong>{user.nom_usuario || 'Jugador 1'}</strong> vs <strong>{player2Name}</strong></>
            : <>Partida de: <strong>{user.nom_usuario || "Jugador"}</strong></>
          }
        </h2>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {gameMode === 'bot' && (
            <select
              value={difficulty}
              onChange={handleChangeDifficulty}
              style={{
                padding: '8px 16px',
                backgroundColor: '#3b82f6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              <option value="easy">Dificultad: Fácil</option>
              <option value="medium">Dificultad: Medio</option>
              <option value="hard">Dificultad: Difícil</option>
            </select>
          )}

          <button
            onClick={handleAbandon}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Abandonar Partida
          </button>
        </div>
      </div>

      <p style={{ marginBottom: '30px', fontSize: '18px' }}>
        {gameMode === 'pvp' ? 'Los jugadores se turnan. Selecciona una casilla del tablero.' : 'Es tu turno. Selecciona una casilla del tablero.'}
      </p>

      <div key={gameKey} style={{
        padding: '20px',
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
      }}>
        <Board botId={botId} difficulty={difficulty} boardSize={boardSize} gameMode={gameMode} player1Name={user.nom_usuario || 'Jugador 1'} player2Name={player2Name}/>
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
