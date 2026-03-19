import { Board } from '../components/Board'; // Importamos el tablero SVG que creamos

import type {User} from "../types/user";


type PlayPageProps = {
    user: User;
    botId: string;
    boardSize?: number;
    onBackToLobby: any;
};

const PlayPage = ({user, botId, boardSize, onBackToLobby}: PlayPageProps) => {
  // Función para volver al Lobby
  const handleAbandon = async () => {
      onBackToLobby();
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      
      {/* Cabecera de la partida */}
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>Partida de: <strong>{user.nombre}</strong></h2>
        
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
        <Board botId={botId} boardSize={boardSize}/>
      </div>

    </div>
  );
};

export default PlayPage;
