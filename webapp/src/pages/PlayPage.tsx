import { useState } from 'react';
import { Board } from '../components/Board'; 
import type { User } from "../types/user";

type PlayPageProps = {
    user: User;
    botId: string;
    onBackToLobby: () => void; // Especificamos que es una función que no devuelve nada
};

const PlayPage = ({ user, botId, onBackToLobby }: PlayPageProps) => {
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>(
    botId === 'mediumbot' ? 'medium' : 'easy'
  );
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = async () => {
      onBackToLobby();
  };

  const handleChangeDifficulty = () => {
    const newDifficulty = difficulty === 'easy' ? 'medium' : 'easy';
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1); // Usamos la versión de callback para mayor seguridad
  };

  const difficultyText = difficulty === 'easy' ? 'Fácil' : 'Medio';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        {/* Usamos nom_usuario que es el estándar de la interfaz User */}
        <h2>Partida de: <strong>{user.nom_usuario || "Jugador"}</strong></h2>
        
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

      {/* Contenedor del Tablero - Usamos gameKey para forzar el reinicio si cambia la dificultad */}
      <div key={gameKey} style={{ 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
      }}>
        <Board botId={botId} difficulty={difficulty}/>
      </div>

    </div>
  );
};

export default PlayPage;