import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ROUTES } from '../routes/constants';
import { Board } from '../components/Board'; // Importamos el tablero SVG que creamos

const PlayPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();

  // Función para volver al Lobby
  const handleAbandon = () => {
    navigate(ROUTES.GAME_PATH(username || ''));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>Partida de: <strong>{username}</strong></h2>
        
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
      
      <p style={{ marginBottom: '30px', fontSize: '18px' }}>Es tu turno. Selecciona una casilla del tablero.</p>

      {/* Contenedor del Tablero */}
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
      }}>
        <Board />
      </div>

    </div>
  );
};

export default PlayPage;