import React, { useState } from 'react';
import { Hexagon } from './Hexagon';

type CellState = 'empty' | 'human' | 'bot';

interface BoardProps {
  botId: string;
}

export const Board: React.FC<BoardProps> = ({ botId }) => {
  const size = 30; 
  const boardSize = 5; 
  
  const hexWidth = Math.sqrt(3) * size;
  const yOffset = 1.5 * size;
  const startX = 300;
  const startY = 50;

  const [boardState, setBoardState] = useState<Record<string, CellState>>({});
  const [isThinking, setIsThinking] = useState(false);
  const [winner, setWinner] = useState<CellState | null>(null);

  // Genera el YEN basado en el tablero ACTUAL (antes de tu clic)
  const generarYEN = (currentBoard: Record<string, CellState>): object => {
    const filas: string[] = [];
    for (let r = 0; r < boardSize; r++) {
      let filaString = "";
      for (let c = 0; c <= r; c++) {
        const x = boardSize - 1 - r;
        const y = c;
        const z = (boardSize - 1) - x - y;
        const id = `${x}-${y}-${z}`;

        if (currentBoard[id] === 'human') filaString += "B";
        else if (currentBoard[id] === 'bot') filaString += "R";
        else filaString += ".";
      }
      filas.push(filaString);
    }
    return { size: boardSize, turn: 0, players: ["B", "R"], layout: filas.join("/") };
  };

  const handleHexClick = async (x: number, y: number, z: number) => {
    const id = `${x}-${y}-${z}`;
    
    // Si la casilla está ocupada, alguien ya ha ganado, o el servidor está pensando, ignoramos el clic
    if (boardState[id] || isThinking || winner) return;

    // 1. Pintamos tu ficha azul inmediatamente para que la interfaz sea rápida
    const newBoard = { ...boardState, [id]: 'human' as CellState };
    setBoardState(newBoard);
    setIsThinking(true);

    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      
      // 2. Preparamos el paquete EXACTO que espera nuestro nuevo endpoint de Rust
      const payload = {
        yen: generarYEN(boardState), // Enviamos cómo estaba el tablero ANTES de tu clic
        action: "Place",             // Le decimos a Rust que queremos colocar una ficha
        player: 0,                   // El jugador 0 (B) es el humano, el jugador 1 (R) es el bot. Esto es importante para que Rust sepa quién hizo la jugada.
        coords: { x, y, z }          // Le decimos a Rust DÓNDE la hemos colocado
      };

      // 3. Llamamos al nuevo endpoint /play
      const res = await fetch(`${GAMEY_URL}/v1/ybot/play/${botId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        
        // 4. Actualizamos el tablero con el movimiento del bot (si lo hubo)
        if (data.bot_moved) {
          const botId = `${data.bot_moved.x}-${data.bot_moved.y}-${data.bot_moved.z}`;
          newBoard[botId] = 'bot' as CellState;
          setBoardState({ ...newBoard });
        }

        // 5. El servidor nos dice si el juego ha terminado gracias a su algoritmo Union-Find
        if (data.status === 'Finished') {
          // Si gana el 0 (B), eres tú. Si gana el 1 (R), es el bot.
          setWinner(data.winner === 0 ? 'human' : 'bot');
        }

      } else {
        console.error("El servidor rechazó la jugada:", await res.text());
        // Si el servidor falla, quitamos tu ficha azul porque la jugada fue inválida
        setBoardState(boardState); 
      }
    } catch (error) {
      console.error("Error al contactar con el servidor:", error);
      setBoardState(boardState);
    } finally {
      setIsThinking(false);
    }
  };

  const resetGame = () => {
    setBoardState({});
    setWinner(null);
  };

  const renderHexagons = () => {
    const hexElements = [];
    for (let r = 0; r < boardSize; r++) {
      for (let c = 0; c <= r; c++) {
        const x = boardSize - 1 - r;
        const y = c;
        const z = (boardSize - 1) - x - y;
        const id = `${x}-${y}-${z}`;

        const cx = startX + (c - r / 2) * hexWidth;
        const cy = startY + r * yOffset;
        
        let color = '#eeeeee'; 
        if (boardState[id] === 'human') color = '#3b82f6';
        if (boardState[id] === 'bot') color = '#ef4444';

        hexElements.push(
          <Hexagon key={id} cx={cx} cy={cy} size={size} color={color} onClick={() => handleHexClick(x, y, z)} />
        );
      }
    }
    return hexElements;
  };

  let statusMessage = 'Tu turno (Juegas con Azul)';
  let statusColor = '#3b82f6';

  if (winner === 'human') {
    statusMessage = '🎉 ¡HAS GANADO LA PARTIDA! 🎉';
    statusColor = '#22c55e';
  } else if (winner === 'bot') {
    statusMessage = '💀 El Bot te ha ganado...';
    statusColor = '#ef4444';
  } else if (isThinking) {
    statusMessage = '🤖 El servidor está procesando...';
    statusColor = '#ef4444';
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p style={{ height: '24px', fontWeight: 'bold', color: statusColor, marginBottom: '10px', fontSize: winner ? '20px' : '16px' }}>
        {statusMessage}
      </p>
      
      <svg width="600" height="400" style={{ backgroundColor: '#fafafa', borderRadius: '10px' }}>
        {renderHexagons()}
      </svg>

      {winner && (
        <button 
          onClick={resetGame}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          🔄 Volver a jugar
        </button>
      )}
    </div>
  );
};