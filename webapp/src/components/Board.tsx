import { useState } from 'react';
import { Hexagon } from './Hexagon';

type BoardProps = {
    botId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    boardSize: number;
    gameMode: 'bot' | 'pvp';
    // Nombre del primer jugador en modo PvP (nombre del usuario autenticado)
    player1Name: string;
    // Nombre del segundo jugador en modo PvP (por defecto 'Invitado')
    player2Name: string;
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

export const Board = ({botId, difficulty, boardSize, gameMode, player1Name, player2Name}: BoardProps) => {
  // ── Viewport SVG fijo ────────────────────────────────────────────────────
  const SVG_W = 600;
  const SVG_H = 560;
  const PADDING = 30;

  //   Fila más ancha  = boardSize hexágonos → ancho total = boardSize * sqrt(3)*size
  //   Número de filas = boardSize           → alto total  = (boardSize-1)*1.5*size + 2*size
  const maxSizeByWidth  = (SVG_W - 2 * PADDING) / (boardSize * Math.sqrt(3));
  const maxSizeByHeight = (SVG_H - 2 * PADDING) / ((boardSize - 1) * 1.5 + 2);
  const size = Math.floor(Math.min(maxSizeByWidth, maxSizeByHeight));

  const hexWidth = Math.sqrt(3) * size;   // distancia horizontal entre centros de columna
  const yOffset  = 1.5 * size;            // distancia vertical entre filas

  // Altura total del triángulo
  const totalH = (boardSize - 1) * yOffset + 2 * size;

  // Centro horizontal del SVG
  const svgCenterX = SVG_W / 2;

  // Punto Y desde el que empieza la primera fila, para centrar verticalmente
  const boardTop = (SVG_H - totalH) / 2 + size;
  // ─────────────────────────────────────────────────────────────────────────

  const [boardState, setBoardState] = useState<Record<string, CellState>>({});
  const [isBotThinking, setIsBotThinking] = useState(false);
  const [winner, setWinner] = useState<CellState | null>(null);
  // En modo PvP, controla de quién es el turno: 'human' = Jugador 1 (azul), 'bot' = Jugador 2 (rojo)
  const [pvpTurn, setPvpTurn] = useState<'human' | 'bot'>('human');

  const handleWinner = (status: GameStatus): void => {
      if (status.Finished !== undefined) {
          const userWon = status.Finished.winner == 0;
          const winner = userWon ? "human" : "bot";
          setWinner(winner);

          // Guardar la partida en la base de datos
          salvarPartidaEnBD(userWon);
      }
  };

  console.debug(botId);

  // Serializa el estado del tablero al formato YEN que entiende el backend Gamey.
  // El parámetro 'turn' indica qué jugador mueve a continuación: 0 = B (azul), 1 = R (rojo).
  // En modo bot siempre es 1 (le toca al bot). En modo PvP varía según el turno actual.
  const generarYEN = (currentBoard: Record<string, CellState>, turn: number = 1): object => {
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
    return { size: boardSize, turn, players: ["B", "R"], layout: filas.join("/") };
  };

  // Diccionario de bots
const BOT_ENDPOINTS: Record<string, string> = {
  easy: 'random_bot',
  medium: 'mediumbot',
  hard: 'bridgebot'

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

      const humanWon = data.status.Finished?.winner === 0;
      if (!humanWon && data.coords && data.coords.x !== undefined) {
        const botMoveId = `${data.coords.x}-${data.coords.y}-${data.coords.z}`;
        setBoardState({ ...currentBoard, [botMoveId]: 'bot' as CellState });
      } else if (!humanWon) {
        console.warn("El bot devolvió una respuesta válida pero sin coordenadas.");
      }
      handleWinner(data.status);
    } else {
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

  // Consulta al backend Gamey si la partida ha terminado tras el movimiento de un jugador en modo PvP.
  // Se reutiliza el endpoint de elección de bot únicamente para obtener el estado del juego (status),
  // ignorando las coordenadas que devuelve (el bot no llega a jugar).
  //
  // Gamey espera siempre turn: 1 (el jugador que va a mover es player 1 / R).
  // Cuando acaba de mover J2 ('bot'), intercambiamos las piezas en el YEN:
  //   - Las piezas de J2 se envían como 'B' (player 0)
  //   - Las piezas de J1 se envían como 'R' (player 1)
  // Así Gamey siempre evalúa "¿ganó player 0 (el que acaba de mover)?".
  // 'currentTurn': jugador que acaba de mover ('human'=J1, 'bot'=J2).
  const checkWinViaPvP = async (board: Record<string, CellState>, currentTurn: 'human' | 'bot') => {
    setIsBotThinking(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';

      // Si J2 (bot) acaba de mover, intercambiamos el encoding de las piezas
      const swapped = currentTurn === 'bot';
      const filas: string[] = [];
      for (let r = 0; r < boardSize; r++) {
        let filaString = "";
        for (let c = 0; c <= r; c++) {
          const x = boardSize - 1 - r;
          const y = c;
          const z = (boardSize - 1) - x - y;
          const cell = board[`${x}-${y}-${z}`];
          if (cell === 'human') filaString += swapped ? 'R' : 'B';
          else if (cell === 'bot') filaString += swapped ? 'B' : 'R';
          else filaString += '.';
        }
        filas.push(filaString);
      }
      const yenPayload = { size: boardSize, turn: 1, players: ["B", "R"], layout: filas.join("/") };

      const res = await fetch(`${GAMEY_URL}/v1/ybot/choose/random_bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: MoveResponse = await res.json();

        // Solo declaramos ganador si winner === 0, es decir, si ganó 'B' (el jugador que
        // acaba de mover en nuestra codificación). Si winner === 1, significa que el movimiento
        // ALEATORIO que el bot sugería habría ganado para R, pero ese movimiento no se juega
        // en PvP, así que lo ignoramos y continuamos la partida.
        if (data.status.Finished !== undefined && data.status.Finished.winner === 0) {
          // B ganó: si no hubo swap → J1 ('human'); si hubo swap → J2 ('bot')
          const playerWon: CellState = swapped ? 'bot' : 'human';
          setWinner(playerWon);
          // Desde el punto de vista de la BD, 'human' (Jugador 1) es quien gana o pierde.
          // Se guarda el nombre del J2 como oponente.
          salvarPartidaEnBD(playerWon === 'human', player2Name);
        } else {
          // Partida en curso (o el bot hipotético ganaría, lo ignoramos): alternar turno
          setPvpTurn(currentTurn === 'human' ? 'bot' : 'human');
        }
      } else {
        const errorText = await res.text();
        console.error(`Error al verificar el estado PvP (${res.status}):`, errorText);
      }
    } catch (error) {
      console.error("Error al contactar con Gamey para verificar victoria PvP:", error);
    } finally {
      setIsBotThinking(false);
    }
  };

  // Guarda el resultado de la partida en la base de datos del servicio de usuarios.
  // En modo bot, el nombre del oponente se deduce de la dificultad.
  // En modo PvP, se pasa explícitamente 'jugador' como nombre del oponente.
  const salvarPartidaEnBD = async (userWon: boolean, oponenteName?: string) => {
    try {
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const oponente = oponenteName ?? (difficulty === 'easy' ? 'random_bot' : difficulty === 'medium' ? 'mediumbot' : 'bridgebot');

      const res = await fetch(`${USERS_URL}/guardar-partida`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oponente, ganada: userWon })
      });

      if (res.ok) {
        console.log('Partida guardada en la base de datos correctamente.');
      } else {
        const errorText = await res.text();
        console.error(`Error al guardar la partida (${res.status}):`, errorText);
      }
    } catch (error) {
      console.error("Error al guardar la partida en BD:", error);
    }
  };

  const handleHexClick = (x: number, y: number, z: number) => {
    const id = `${x}-${y}-${z}`;

    // Ignorar clic si la celda ya está ocupada, la partida ha terminado, o se está esperando respuesta del backend
    if (boardState[id] || winner || isBotThinking) return;

    if (gameMode === 'pvp') {
      // En PvP: Jugador 1 usa 'human' (azul) y Jugador 2 usa 'bot' (rojo)
      const cell: CellState = pvpTurn === 'human' ? 'human' : 'bot';
      const newBoard: Record<string, CellState> = { ...boardState, [id]: cell };
      setBoardState(newBoard);
      // Delegar la comprobación de victoria al backend Gamey
      checkWinViaPvP(newBoard, pvpTurn);
    } else {
      const newBoard: Record<string, CellState> = { ...boardState, [id]: 'human' as CellState };
      setBoardState(newBoard);
      askBotForMove(newBoard);
    }
  };

  const resetGame = () => {
    setBoardState({});
    setWinner(null);
    // Reiniciar el turno al Jugador 1 al empezar una nueva partida en modo PvP
    setPvpTurn('human');
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

  // Mensajes de la interfaz superior: cambian según el modo de juego y el estado actual
  let statusMessage: string;
  let statusColor: string;

  if (gameMode === 'pvp') {
    if (winner === 'human') {
      statusMessage = `¡${player1Name} GANA LA PARTIDA!`;
      statusColor = '#22c55e';
    } else if (winner === 'bot') {
      statusMessage = `¡${player2Name} GANA LA PARTIDA!`;
      statusColor = '#ef4444';
    } else if (pvpTurn === 'human') {
      statusMessage = `Turno de ${player1Name} (Azul)`;
      statusColor = '#3b82f6';
    } else {
      statusMessage = `Turno de ${player2Name} (Rojo)`;
      statusColor = '#ef4444';
    }
  } else {
    if (winner === 'human') {
      statusMessage = '¡HAS GANADO LA PARTIDA!';
      statusColor = '#22c55e';
    } else if (winner === 'bot') {
      statusMessage = 'El Bot te ha ganado...';
      statusColor = '#ef4444';
    } else if (isBotThinking) {
      statusMessage = 'El bot está pensando...';
      statusColor = '#ef4444';
    } else {
      statusMessage = 'Tu turno (Juegas con Azul)';
      statusColor = '#3b82f6';
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <p style={{ height: '24px', fontWeight: 'bold', color: statusColor, marginBottom: '10px', fontSize: winner ? '20px' : '16px' }}>
        {statusMessage}
      </p>
      <svg width={SVG_W} height={SVG_H} style={{ backgroundColor: '#fafafa', borderRadius: '10px' }}>
        {renderHexagons()}
      </svg>

      {winner && (
        <button
          onClick={resetGame}
          style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Volver a jugar
        </button>
      )}
    </div>
  );
};
