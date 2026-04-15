import { useState } from 'react';
import { Hexagon } from './Hexagon';

type BoardProps = {
    botId: string;
    difficulty: 'easy' | 'medium' | 'hard';
    boardSize: number;                    // número de hexágonos por lado del triángulo (5, 10 o 15)
    gameMode: 'bot' | 'pvp';             // 'bot' = jugador vs IA  |  'pvp' = dos jugadores locales
    player1Name: string;                  // nombre del usuario autenticado
    player2Name: string;                  // nombre del Jugador 2 en modo PvP (por defecto 'Invitado')
};

// 'human' = Jugador 1 (azul)  |  'bot' = Jugador 2 / IA (rojo)
type CellState = 'empty' | 'human' | 'bot';

type Coordinates = {
    x: number; 
    y: number;
    z: number;
};

type GameStatus = {
    Ongoing: PlayerId | undefined;   // la partida continúa
    Finished: PlayerId | undefined;  // la partida terminó; winner: 0=B(azul) | 1=R(rojo)
};

type PlayerId = {
    winner: number;
};

type MoveResponse = { // respuesta del endpoint /v1/ybot/choose/{bot_id} de Gamey
    api_version: string;
    bot_id: string;
    coords: Coordinates;  // movimiento sugerido por el bot
    status: GameStatus;   // estado de la partida tras evaluar el tablero
};

export const Board = ({botId, difficulty, boardSize, gameMode, player1Name, player2Name}: BoardProps) => {

  // Calcula el tamaño del hexágono para que el tablero quepa en el SVG
  const SVG_W = 600;
  const SVG_H = 560;
  const PADDING = 30;

  const maxSizeByWidth  = (SVG_W - 2 * PADDING) / (boardSize * Math.sqrt(3));
  const maxSizeByHeight = (SVG_H - 2 * PADDING) / ((boardSize - 1) * 1.5 + 2);
  const size = Math.floor(Math.min(maxSizeByWidth, maxSizeByHeight)); // tamaño final del hexágono (el menor de los dos límites)

  const hexWidth = Math.sqrt(3) * size;
  const yOffset  = 1.5 * size;

  const totalH    = (boardSize - 1) * yOffset + 2 * size;
  const svgCenterX = SVG_W / 2;
  const boardTop   = (SVG_H - totalH) / 2 + size; // punto Y de inicio del tablero, centrado verticalmente

  // Mapa de celdas ocupadas: clave = "x-y-z", valor = quién la ocupa
  const [boardState, setBoardState] = useState<Record<string, CellState>>({});

  // Bloquea nuevos clics mientras se espera respuesta del backend (modo bot y PvP)
  const [isBotThinking, setIsBotThinking] = useState(false);

  // null = en curso  |  'human' = ganó J1  |  'bot' = ganó J2/bot
  const [winner, setWinner] = useState<CellState | null>(null);

  // Solo relevante en PvP: de quién es el turno; siempre empieza J1
  const [pvpTurn, setPvpTurn] = useState<'human' | 'bot'>('human');

  // Procesa el status de Gamey en modo bot y actualiza el ganador
  const handleWinner = (status: GameStatus): void => {
    if (status.Finished !== undefined) {
      const userWon = status.Finished.winner == 0; // 0 = B = humano
      setWinner(userWon ? 'human' : 'bot');
      salvarPartidaEnBD(userWon);
    }
  };

  console.debug(botId);

  // Convierte el estado del tablero al formato YEN que espera Gamey.
  // Layout: filas separadas por '/', cada carácter es B / R / .
  const generarYEN = (currentBoard: Record<string, CellState>, turn: number = 1): object => {
    const filas: string[] = [];
    for (let r = 0; r < boardSize; r++) {
      let filaString = "";
      for (let c = 0; c <= r; c++) {
        // Conversión de posición (fila, columna) a coordenadas baricéntricas
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

  const BOT_ENDPOINTS: Record<string, string> = { // mapeo de dificultad al identificador del bot en Gamey
    easy:   'random_bot',
    medium: 'mediumbot',
    hard:   'bridgebot'
  };

  // Envía el tablero a Gamey y coloca el movimiento devuelto por el bot.
  // Si el humano ya ganó antes de que el bot mueva, no coloca ficha del bot.
  const askBotForMove = async (currentBoard: Record<string, CellState>) => {
    setIsBotThinking(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      const yenPayload = generarYEN(currentBoard); // turn=1 por defecto: le toca al bot como player 1
      const botEndpoint = BOT_ENDPOINTS[difficulty];

      const res = await fetch(`${GAMEY_URL}/v1/ybot/choose/${botEndpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: MoveResponse = await res.json();

        const humanWon = data.status.Finished?.winner === 0; // el humano ganó con su último movimiento
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

  // Comprueba si alguien ganó en PvP consultando a Gamey.
  // Siempre enviamos turn:1 para que Gamey evalúe "¿ganó B (player 0)?".
  // Cuando acaba de mover J2, intercambiamos B y R en el YEN para que J2 sea tratado como B.
  // Solo declaramos ganador con winner===0; ignoramos winner===1 porque corresponde
  // al movimiento aleatorio del bot que Gamey hace internamente y que en PvP no ocurre.
  const checkWinViaPvP = async (board: Record<string, CellState>, currentTurn: 'human' | 'bot') => {
    setIsBotThinking(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';

      const swapped = currentTurn === 'bot'; // true si J2 acaba de mover: intercambiar codificación B y R
      const filas: string[] = [];
      for (let r = 0; r < boardSize; r++) {
        let filaString = "";
        for (let c = 0; c <= r; c++) {
          const x = boardSize - 1 - r;
          const y = c;
          const z = (boardSize - 1) - x - y;
          const cell = board[`${x}-${y}-${z}`];
          // Sin swap: J1-B, J2-R  |  Con swap: J2-B (el que acaba de mover), J1-R
          if (cell === 'human') filaString += swapped ? 'R' : 'B';
          else if (cell === 'bot') filaString += swapped ? 'B' : 'R';
          else filaString += '.';
        }
        filas.push(filaString);
      }
      const yenPayload = { size: boardSize, turn: 1, players: ["B", "R"], layout: filas.join("/") };

      // Se usa random_bot solo para obtener el campo status; las coords sugeridas se ignoran
      const res = await fetch(`${GAMEY_URL}/v1/ybot/choose/random_bot`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: MoveResponse = await res.json();

        if (data.status.Finished !== undefined && data.status.Finished.winner === 0) {
          // B ganó: si hubo swap B=J2 ('bot'), si no hubo swap B=J1 ('human')
          const playerWon: CellState = swapped ? 'bot' : 'human';
          setWinner(playerWon);
          salvarPartidaEnBD(playerWon === 'human', player2Name); // guarda con el nombre de J2 como oponente
        } else {
          setPvpTurn(currentTurn === 'human' ? 'bot' : 'human'); // nadie ganó: alterna el turno
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

  // Guarda el resultado en el servicio de usuarios (puerto 3000).
  // En modo bot deduce el nombre del oponente de la dificultad si no se pasa explícitamente.
  const salvarPartidaEnBD = async (userWon: boolean, oponenteName?: string) => {
    try {
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const oponente = oponenteName ?? BOT_ENDPOINTS[difficulty];

      const res = await fetch(`${USERS_URL}/guardar-partida`, {
        method: 'POST',
        credentials: 'include', // incluye la cookie de sesión para autenticar al usuario
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

    // Ignora el clic si la celda está ocupada, la partida terminó o el backend está procesando
    if (boardState[id] || winner || isBotThinking) return;

    if (gameMode === 'pvp') {
      const cell: CellState = pvpTurn === 'human' ? 'human' : 'bot'; // J1 coloca azul, J2 coloca rojo
      const newBoard: Record<string, CellState> = { ...boardState, [id]: cell };
      setBoardState(newBoard);
      checkWinViaPvP(newBoard, pvpTurn); // delega la comprobación de victoria al backend
    } else {
      const newBoard: Record<string, CellState> = { ...boardState, [id]: 'human' as CellState };
      setBoardState(newBoard);
      askBotForMove(newBoard);
    }
  };

  // Reinicia el tablero; en PvP siempre empieza J1
  const resetGame = () => {
    setBoardState({});
    setWinner(null);
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

        const cx = svgCenterX - (r * hexWidth) / 2 + c * hexWidth; // posición X centrada en el SVG
        const cy = boardTop + r * yOffset;

        let color = '#eeeeee';                              // vacía: gris
        if (boardState[id] === 'human') color = '#3b82f6'; // J1: azul
        if (boardState[id] === 'bot')   color = '#ef4444'; // J2/bot: rojo

        hexElements.push(
          <Hexagon key={id} cx={cx} cy={cy} size={size} color={color} onClick={() => handleHexClick(x, y, z)} />
        );
      }
    }
    return hexElements;
  };

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
      {/* Barra de estado: indica turno actual o ganador */}
      <p style={{ height: '24px', fontWeight: 'bold', color: statusColor, marginBottom: '10px', fontSize: winner ? '20px' : '16px' }}>
        {statusMessage}
      </p>

      {/* Tablero SVG con todos los hexágonos */}
      <svg width={SVG_W} height={SVG_H} style={{ backgroundColor: '#fafafa', borderRadius: '10px' }}>
        {renderHexagons()}
      </svg>

      {/* Botón de reinicio: solo aparece cuando la partida ha terminado */}
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
