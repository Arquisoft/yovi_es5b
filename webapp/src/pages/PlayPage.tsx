import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';

import { ROUTES } from '../routes/constants';
import { Board } from '../components/Board';

// 1. Tipamos los niveles permitidos estrictamente 
type DifficultyLevel = 'easy' | 'medium' | 'hard';

// 2. Diccionarios de traducción bidireccional
const urlToDifficulty: Record<string, DifficultyLevel> = {
  'random_bot': 'easy',
  'mediumbot': 'medium',
  'bridgebot': 'hard',
};

const difficultyToUrl: Record<DifficultyLevel, string> = {
  'easy': 'random_bot',
  'medium': 'mediumbot',
  'hard': 'bridgebot',
};

const PlayPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Leemos la URL inicial y usamos el diccionario. Cae a 'easy' si falla.
  const currentBotParam = searchParams.get('bot') || '';
  const initialDifficulty = urlToDifficulty[currentBotParam] || 'easy';

  // El estado ahora soporta 'hard'
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = () => {
    navigate(ROUTES.GAME_PATH(username || ''));
  };

  // 3. La nueva función lee directamente el valor del elemento select
  const handleChangeDifficulty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel;
    const newBotParam = difficultyToUrl[newDifficulty];

    setDifficulty(newDifficulty);
    setGameKey(gameKey + 1); // Forzamos el reinicio del tablero
    setSearchParams({ bot: newBotParam }); // Sincronizamos la URL
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>Partida de: <strong>{username}</strong></h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          
          {/* Reemplazamos el botón por un menú desplegable óptimo */}
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
              outline: 'none'
            }}
          >
            <option value="easy">Dificultad: Fácil</option>
            <option value="medium">Dificultad: Medio</option>
            <option value="hard">Dificultad: Difícil</option>
          </select>
          
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
      
      <p style={{ marginBottom: '30px', fontSize: '18px' }}>Es tu turno. Selecciona una casilla del tablero.</p>

      {/* Contenedor del Tablero */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
      }}>
        <Board key={gameKey} difficulty={difficulty} />
      </div>

    </div>
  );
};

export default PlayPage;
