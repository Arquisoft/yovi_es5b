import React, { useState } from 'react';
import { Hexagon } from './Hexagon';

type CellState = 'empty' | 'human' | 'bot';

export const Board: React.FC = () => {
  const size = 30; 
  const boardSize = 5; 
  
  const hexWidth = Math.sqrt(3) * size;
  const yOffset = 1.5 * size;
  const startX = 300;
  const startY = 50;

  const [boardState, setBoardState] = useState<Record<string, CellState>>({});
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [winner, setWinner] = useState<CellState | null>(null);

  const checkWin = (board: Record<string, CellState>, player: CellState): boolean => {
    if (player === 'empty') return false;

    const playerCells = Object.keys(board).filter(id => board[id] === player);
    const visited = new Set<string>();

    for (const startCell of playerCells) {
      if (visited.has(startCell)) continue;

      let touchesA = false;
      let touchesB = false;
      let touchesC = false;

      const stack = [startCell];
      visited.add(startCell);

      while (stack.length > 0) {
        const current = stack.pop()!;
        const [x, y, z] = current.split('-').map(Number);

        if (x === 0) touchesA = true;
        if (y === 0) touchesB = true;
        if (z === 0) touchesC = true;

        // Si este grupo de fichas toca los 3 lados, ¡Ha ganado!
        if (touchesA && touchesB && touchesC) return true;

        // Calculamos los 6 vecinos posibles en coordenadas baricéntricas
        const neighbors = [
          `${x+1}-${y-1}-${z}`, `${x+1}-${y}-${z-1}`,
          `${x-1}-${y+1}-${z}`, `${x}-${y+1}-${z-1}`,
          `${x-1}-${y}-${z+1}`, `${x}-${y-1}-${z+1}`
        ];

        for (const neighbor of neighbors) {
          if (board[neighbor] === player && !visited.has(neighbor)) {
            visited.add(neighbor);
            stack.push(neighbor);
          }
        }
      }
    }
    return false;
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

  const askBotForMove = async (currentBoard: Record<string, CellState>) => {
    setIsBotThinking(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      const yenPayload = generarYEN(currentBoard); 

      const res = await fetch(`${GAMEY_URL}/v1/ybot/choose/random_bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.coords && data.coords.x !== undefined) {
          const botMoveId = `${data.coords.x}-${data.coords.y}-${data.coords.z}`;
          
          const newBoard = { ...currentBoard, [botMoveId]: 'bot' as CellState };
          setBoardState(newBoard);

          // Comprobamos si el bot nos ha ganado
          if (checkWin(newBoard, 'bot')) {
            setWinner('bot');
          }
        } else {
          console.log("El bot no tiene movimientos disponibles (o hay un empate).");
        }
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

    // Comprobamos si el humano ha ganado con este clic
    if (checkWin(newBoard, 'human')) {
      setWinner('human');
      return; // Si el humano gana, el bot ya no tira
    }

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