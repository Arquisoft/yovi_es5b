import { useState } from 'react';
import { Board } from '../components/Board'; 
import type { User } from "../types/user";
import '../css/Estilo.css';

type PlayPageProps = {
  user: User;
  botId: string;
  boardSize: number;
  onBackToLobby: () => void;
};

const PlayPage = ({user, botId, boardSize, onBackToLobby}: PlayPageProps) => {
  // Estado para controlar la dificultad actual del bot
  const [difficulty, setDifficulty] = useState<'easy' | 'medium'>(
    botId === 'mediumbot' ? 'medium' : 'easy'
  );
  
  // Clave para forzar el re-renderizado del componente Board cuando cambie la dificultad
  const [gameKey, setGameKey] = useState(0);

  // Función para volver al menú principal
  const handleAbandon = async () => {
      onBackToLobby();
  };

 // Handler que soporta las 3 dificultades
  const handleChangeDifficulty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel;
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1);
  };

  // Texto amigable para mostrar en el botón
  const difficultyText = difficulty === 'easy' ? 'Fácil' : 'Medio';

  return (
    <div className="lobby-container"> {/* Reutilizamos el centrado maestro */}
      
      <div className="play-header">
        {/* Título de la partida usando el nombre de usuario del objeto user */}
        <h2 className="play-title">Partida de: <strong>{user.nom_usuario || "Jugador"}</strong></h2>
        
        <div className="header-actions">
          <select 
            value={difficulty} 
            onChange={handleChangeDifficulty}
          >
          <option value="easy">Dificultad: Fácil</option>
            <option value="medium">Dificultad: Medio</option>
            <option value="hard">Dificultad: Difícil</option>
          </select>
          
          {/* Botón para salir (Estilo logout/rojo) */}
          <button onClick={handleAbandon} className="btn-logout">
            Abandonar
          </button>
        </div>
      </div>
      
      {/* Mensaje de estado para el jugador */}
      <p className="turn-indicator">Es tu turno. Selecciona una casilla del tablero.</p>

      {/* Contenedor del Tablero con la clase card para que resalte sobre el fondo */}
      <div key={gameKey} className="card board-container">
        <Board botId={botId} difficulty={difficulty} boardSize={boardSize}/>
      </div>

      <div>
        <h3>Reglas del Juego Y</h3>
        <p>
          Pulsa un hexágono para rellenarlo de tu color. Debes intentar trazar una línea 
          de tu color que logre conectar los tres bordes del triángulo 
          que compone el tablero.
        </p>
      </div>

    </div>
  );
};

export default PlayPage;