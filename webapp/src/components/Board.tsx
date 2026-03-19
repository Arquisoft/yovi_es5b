import { useState } from 'react';
import { Hexagon } from './Hexagon';

type BoardProps = {
    botId: string;
    difficulty: 'easy' | 'medium';
};

type CellState = 'empty' | 'human' | 'bot';

type Coordinates = {
    x : number;
    y : number;
    z : number;
};

type GameStatus = {
    Ongoing: PlayerId | undefined;
    Finished: PlayerId | undefined;
};

type PlayerId = {
    winner: number;
};

type MoveResponse = {
    api_version: string;
    bot_id: string;
    coords: Coordinates;
    status: GameStatus;
};


export const Board = ({botId, difficulty}: BoardProps) => {
  const size = 30; 
  const boardSize = 5; 
  
  const hexWidth = Math.sqrt(3) * size;
  const yOffset = 1.5 * size;
  const startX = 300;
  const startY = 50;

  const [boardState, setBoardState] = useState<Record<string, CellState>>({});
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [winner, setWinner] = useState<CellState | null>(null);

  const handleWinner = (status: GameStatus): void => {
      if (status.Finished !== undefined) {
          const winner = status.Finished.winner == 0 ? "human" : "bot";
          setWinner(winner);
      }
  };

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
    return { size: boardSize, turn: 1, players: ["B", "R"], layout: filas.join("/") };
  };

  // Diccionario de bots
const BOT_ENDPOINTS: Record<string, string> = {
  easy: 'random_bot',
  medium: 'mediumbot',
  // hard: 'attack_bot' 
};

const askBotForMove = async (currentBoard: Record<string, CellState>) => {
  setIsBotThinking(true);
  try {
    const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
    const yenPayload = generarYEN(currentBoard);
    
    const botEndpoint = BOT_ENDPOINTS[difficulty]; 

    const res = await fetch(`${GAMEY_URL}/v1/ybot/choose/${botEndpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(yenPayload)
    });

    if (res.ok) {
      const data: MoveResponse = await res.json();
      
      if (data.coords && data.coords.x !== undefined) {
        const botMoveId = `${data.coords.x}-${data.coords.y}-${data.coords.z}`;
        setBoardState({ ...currentBoard, [botMoveId]: 'bot' as CellState });
      } else {
        console.warn("El bot devolvió una respuesta válida pero sin coordenadas.");
      }
      handleWinner(data.status);
    } else {
      // AQUÍ evitamos el fallo silencioso
      const errorText = await res.text();
      console.error(`Error del servidor (${res.status}):`, errorText);
      alert(`Error en el servidor al pedir movimiento al bot: ${botEndpoint}. Revisa la consola.`);
    }
  } catch (error) {
    console.error("Error al contactar con el bot:", error);
  } finally {
    setIsBotThinking(false);
  }
};

  const handleHexClick = (x: number, y: number, z: number) => {
    const id = `${x}-${y}-${z}`;
    
    if (boardState[id] || isBotThinking || winner) return;

    const newBoard: Record<string, CellState> = { ...boardState, [id]: 'human' as CellState };
    setBoardState(newBoard);

    askBotForMove(newBoard);
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

  // Mensajes de la interfaz superior
  let statusMessage = 'Tu turno (Juegas con Azul)';
  let statusColor = '#3b82f6';

  if (winner === 'human') {
    statusMessage = '🎉 ¡HAS GANADO LA PARTIDA! 🎉';
    statusColor = '#22c55e'; // Verde
  } else if (winner === 'bot') {
    statusMessage = '💀 El Bot te ha ganado...';
    statusColor = '#ef4444'; // Rojo
  } else if (isBotThinking) {
    statusMessage = '🤖 El bot está pensando...';
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
