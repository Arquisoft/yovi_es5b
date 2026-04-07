import { useState } from 'react';
import { Hexagon } from './Hexagon';

type BoardProps = {
    botId: string;
    difficulty: 'easy' | 'medium';
    boardSize: number;
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

export const Board = ({difficulty, boardSize}: BoardProps) => {
  // ── Viewport SVG fijo ────────────────────────────────────────────────────
  const SVG_W = 600;
  const SVG_H = 560;
  const PADDING = 30;

  const maxSizeByWidth  = (SVG_W - 2 * PADDING) / (boardSize * Math.sqrt(3));
  const maxSizeByHeight = (SVG_H - 2 * PADDING) / ((boardSize - 1) * 1.5 + 2);
  const size = Math.floor(Math.min(maxSizeByWidth, maxSizeByHeight));

  const hexWidth = Math.sqrt(3) * size; 
  const yOffset  = 1.5 * size; 
  const totalH = (boardSize - 1) * yOffset + 2 * size;
  const svgCenterX = SVG_W / 2;
  const boardTop = (SVG_H - totalH) / 2 + size;
  // ─────────────────────────────────────────────────────────────────────────
 
  const [boardState, setBoardState] = useState<Record<string, CellState>>({});
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [winner, setWinner] = useState<CellState | null>(null);

  const handleWinner = (status: GameStatus): void => {
      if (status.Finished !== undefined) {
          const userWon = status.Finished.winner == 0;
          const winnerState = userWon ? "human" : "bot";
          setWinner(winnerState);
          salvarPartidaEnBD(userWon);
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

  const BOT_ENDPOINTS: Record<string, string> = {
    easy: 'random_bot',
    medium: 'mediumbot'
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
        
        if (data.status.Finished !== undefined) {
          handleWinner(data.status);
        } else if (data.coords && data.coords.x !== undefined) {
          const botMoveId = `${data.coords.x}-${data.coords.y}-${data.coords.z}`;
          setBoardState({ ...currentBoard, [botMoveId]: 'bot' });
          handleWinner(data.status);
        }
      }
    } catch (error) {
      console.error("Error al contactar con el bot:", error);
    } finally {
      setIsBotThinking(false);
    }
  };

  const salvarPartidaEnBD = async (userWon: boolean) => {
    try {
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      await fetch(`${USERS_URL}/guardar-partida`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          oponente: difficulty === 'easy' ? 'random_bot' : 'mediumbot',
          ganada: userWon
        })
      });
    } catch (error) {
      console.error("Error al guardar la partida en BD:", error);
    }
  };

  const handleHexClick = (x: number, y: number, z: number) => {
    const id = `${x}-${y}-${z}`;
    if (boardState[id] || isBotThinking || winner) return;
    const newBoard: Record<string, CellState> = { ...boardState, [id]: 'human' };
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

        const cx = svgCenterX - (r * hexWidth) / 2 + c * hexWidth;
        const cy = boardTop + r * yOffset;
        
        // Colores lógicos (nombres definidos en Estilo.css)
        let color = 'lightgrey'; 
        if (boardState[id] === 'human') color = 'dodgerblue';
        if (boardState[id] === 'bot') color = 'crimson';

        hexElements.push(
          <Hexagon key={id} cx={cx} cy={cy} size={size} color={color} onClick={() => handleHexClick(x, y, z)} />
        );
      }
    }
    return hexElements;
  };

  let statusMessage = 'Tu turno (Juegas con Azul)';
  let statusClass = 'status-human';

  if (winner === 'human') {
    statusMessage = '¡HAS GANADO LA PARTIDA!';
    statusClass = 'status-winner';
  } else if (winner === 'bot') {
    statusMessage = 'El Bot te ha ganado...';
    statusClass = 'status-bot';
  } else if (isBotThinking) {
    statusMessage = 'El bot está pensando...';
    statusClass = 'status-bot';
  }

  return (
    <div className="board-wrapper">
      <p className={`board-status ${statusClass} ${winner ? 'winner-text' : ''}`}>
        {statusMessage}
      </p>
      
      <svg width={SVG_W} height={SVG_H} className="board-svg">
        {renderHexagons()}
      </svg>

      {winner && (
        <button onClick={resetGame} className="btn-play">
          🔄 Volver a jugar
        </button>
      )}
    </div>
  );
};