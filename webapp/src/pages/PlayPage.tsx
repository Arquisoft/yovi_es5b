import React, { useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';

import { ROUTES } from '../routes/constants';
import { Board } from '../components/Board'; // Importamos el tablero SVG que creamos

const PlayPage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const [isResigning, setIsResigning] = useState(false);

  const queryParams = new URLSearchParams(location.search);
  const selectedBot = queryParams.get('bot') || 'random_bot';

  // Función para volver al Lobby
  const handleAbandon = async () => {
    setIsResigning(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      
      // Creamos un YEN inventado solo para que el servidor lo pueda procesar.
      // Lo importante aquí no es el tablero, sino la acción "Resign".
      const dummyYen = {
        size: 5,
        turn: 0,
        players: ["B", "R"],
        layout: "B/../.../..../....." 
      };

      await fetch(`${GAMEY_URL}/v1/ybot/play/${selectedBot}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          yen: dummyYen,
          action: "Resign", // Acción de rendirse
          player: 0         // El jugador 0 (tú) es el que se rinde
        })
      });

    } catch (error) {
      console.error("Error al abandonar la partida:", error);
    } finally {
      setIsResigning(false);
      // Pase lo que pase (incluso si el servidor falla), te sacamos de la partida
      navigate(ROUTES.GAME_PATH(username || ''));
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>Partida de: <strong>{username}</strong></h2>
        
        <button 
          onClick={handleAbandon}
          disabled={isResigning}
          style={{ 
            padding: '8px 16px', 
            backgroundColor: isResigning ? '#fca5a5' : '#ef4444', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: isResigning ? 'wait' : 'pointer',
            fontWeight: 'bold'
          }}
        >
          {isResigning ? 'Saliendo...' : 'Abandonar Partida'}
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
        <Board botId={selectedBot}/>
      </div>

    </div>
  );
};

export default PlayPage;