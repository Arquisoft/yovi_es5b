import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useState } from 'react';


import { ROUTES } from '../routes/constants';
import { Board } from '../components/Board';

const PlayPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Leemos la URL al cargar. Si dice medium_bot, empezamos en medio.
  const initialDifficulty = searchParams.get('bot') === 'mediumbot' ? 'medium' : 'easy';
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>(initialDifficulty);
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = () => {
    navigate(ROUTES.GAME_PATH(username || ''));
  };

  const handleChangeDifficulty = () => {
    const newDifficulty = difficulty === 'easy' ? 'medium' : 'easy';
    const newBot = newDifficulty === 'easy' ? 'random_bot' : 'mediumbot';

    setDifficulty(newDifficulty);
    setGameKey(gameKey + 1); 

    // Esto actualiza la URL inmediatamente sin recargar la página
    setSearchParams({ bot: newBot });
  };

  const difficultyText = difficulty === 'easy' ? 'Fácil' : 'Medio';

  // ... (el resto del return se queda exactamente igual)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>Partida de: <strong>{username}</strong></h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button 
            onClick={handleChangeDifficulty}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            {difficultyText}
          </button>
          
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
