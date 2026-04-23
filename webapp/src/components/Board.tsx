import { useState } from 'react';
import { Hexagon } from './Hexagon';
import { useTranslation } from 'react-i18next';
import { translateApiError, type ApiErrorPayload } from '../utils/i18n/errorTranslator';

type BoardProps = {
    botId: string;
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


type StatusResponse = { // respuesta del endpoint /v1/ybot/status de Gamey
    api_version: string;
    status: GameStatus;   // estado de la partida tras evaluar el tablero
};

export const Board = ({botId, boardSize, gameMode, player1Name, player2Name}: BoardProps) => {
  const { t } = useTranslation();
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

  // Sugerencia de movimiento: cada jugador puede pedir una sugerencia por partida.
  // En modo bot solo el humano (azul) puede pedirla. En PvP cada jugador tiene su propia sugerencia.
  const [humanSuggestionUsed, setHumanSuggestionUsed] = useState(false); // J1 (azul) ya pidió sugerencia
  const [pvpBotSuggestionUsed, setPvpBotSuggestionUsed] = useState(false); // J2 (rojo) en PvP ya pidió sugerencia
  const [suggestedCell, setSuggestedCell] = useState<string | null>(null); // id "x-y-z" de la casilla sugerida actualmente
  const [isFetchingSuggestion, setIsFetchingSuggestion] = useState(false); // evita pulsaciones duplicadas al botón

  // Procesa el status de Gamey en modo bot y actualiza el ganador
  const handleWinner = (status: GameStatus): void => {
    if (status.Finished !== undefined) {
      const userWon = status.Finished.winner == 0; // 0 = B = humano
      setWinner(userWon ? 'human' : 'bot');
      salvarPartidaEnBD(userWon);
    }
  };

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

  const askBotForMove = async (currentBoard: Record<string, CellState>) => {
    setIsBotThinking(true);
    try {
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      const yenPayload = generarYEN(currentBoard);
      const botEndpoint = botId;

      const res = await fetch(GAMEY_URL + '/v1/ybot/choose/' + botEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: MoveResponse = await res.json();

        const humanWon = data.status.Finished?.winner === 0;
        if (!humanWon && data.coords && data.coords.x !== undefined) {
          const botMoveId = String(data.coords.x) + '-' + String(data.coords.y) + '-' + String(data.coords.z);
          setBoardState({ ...currentBoard, [botMoveId]: 'bot' as CellState });
        } else if (!humanWon) {
          console.warn(t('board.logs.botMissingCoords'));
        }

        handleWinner(data.status);
      } else {
        let fallbackText = t('errors.generic');
        try {
          const payload = await res.json();
          fallbackText = translateApiError(payload as ApiErrorPayload, t);
        } catch {
          const errorText = await res.text();
          fallbackText = errorText || fallbackText;
        }

        console.error(t('board.logs.serverError', { status: res.status }), fallbackText);
        alert(t('board.requestBotError', { bot: botEndpoint }));
      }
    } catch (error) {
      console.error(t('board.logs.requestBotFailed'), error);
    } finally {
      setIsBotThinking(false);
    }
  };

  // Comprueba si alguien gano en PvP consultando al endpoint de estado de Gamey.
  // No invoca ningun bot: solo evalua el tablero tal como esta.
  const checkWinViaPvP = async (board: Record<string, CellState>, currentTurn: 'human' | 'bot') => {
    setIsBotThinking(true);
    try {
      const turnIdx = currentTurn === 'human' ? 0 : 1;
      const yenPayload = generarYEN(board, turnIdx);

      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
      const res = await fetch(GAMEY_URL + '/v1/ybot/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: StatusResponse = await res.json();

        if (data.status.Finished !== undefined) {
          const playerWon: CellState = data.status.Finished.winner === 0 ? 'human' : 'bot';
          setWinner(playerWon);
          salvarPartidaEnBD(playerWon === 'human', player2Name);
        } else {
          setPvpTurn(currentTurn === 'human' ? 'bot' : 'human');
        }
      } else {
        const errorText = await res.text();
        console.error(t('board.logs.serverError', { status: res.status }), errorText);
      }
    } catch (error) {
      console.error(t('board.logs.requestBotFailed'), error);
    } finally {
      setIsBotThinking(false);
    }
  };

  // Pide sugerencia a bridgebot para el jugador de turno sin modificar el tablero.
  const askSuggestion = async () => {
    if (winner || isFetchingSuggestion || isBotThinking) return;

    const currentTurn: 'human' | 'bot' = gameMode === 'pvp' ? pvpTurn : 'human';
    const alreadyUsed = currentTurn === 'human' ? humanSuggestionUsed : pvpBotSuggestionUsed;
    if (alreadyUsed) return;

    setIsFetchingSuggestion(true);
    try {
      const turnIdx = currentTurn === 'human' ? 0 : 1;
      const yenPayload = generarYEN(boardState, turnIdx);
      const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';

      const res = await fetch(GAMEY_URL + '/v1/ybot/choose/bridgebot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(yenPayload)
      });

      if (res.ok) {
        const data: MoveResponse = await res.json();
        if (data.coords && data.coords.x !== undefined) {
          const cellId = String(data.coords.x) + '-' + String(data.coords.y) + '-' + String(data.coords.z);
          setSuggestedCell(cellId);

          if (currentTurn === 'human') {
            setHumanSuggestionUsed(true);
          } else {
            setPvpBotSuggestionUsed(true);
          }
        } else {
          console.warn(t('board.logs.botMissingCoords'));
        }
      } else {
        const errorText = await res.text();
        console.error(t('board.logs.serverError', { status: res.status }), errorText);
      }
    } catch (error) {
      console.error(t('board.logs.requestBotFailed'), error);
    } finally {
      setIsFetchingSuggestion(false);
    }
  };

  // Guarda el resultado en el servicio de usuarios (puerto 3000).
  const salvarPartidaEnBD = async (userWon: boolean, oponenteName?: string) => {
    try {
      const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
      const oponente = oponenteName ?? botId;

      const res = await fetch(USERS_URL + '/guardar-partida', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oponente, ganada: userWon })
      });

      if (res.ok) {
        console.log(t('board.logs.matchSaved'));
      } else {
        const errorText = await res.text();
        console.error(t('board.logs.matchSaveError', { status: res.status }), errorText);
      }
    } catch (error) {
      console.error(t('board.logs.matchSaveFailed'), error);
    }
  };

  const handleHexClick = (x: number, y: number, z: number) => {
    const id = `${x}-${y}-${z}`;

    // Ignora el clic si la celda está ocupada, la partida terminó o el backend está procesando
    if (boardState[id] || winner || isBotThinking) return;

    // Cualquier clic consume/descarta la sugerencia actual: deja de resaltarse
    if (suggestedCell) setSuggestedCell(null);

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
    // Reset de la sugerencia: en la nueva partida cada jugador vuelve a tener su sugerencia disponible
    setHumanSuggestionUsed(false);
    setPvpBotSuggestionUsed(false);
    setSuggestedCell(null);
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

        // La casilla sugerida se pinta en dorado solo si sigue vacía (si el bot u otro jugador
        // la ocupara, prevalece su color de ocupación)
        if (suggestedCell === id && !boardState[id]) color = '#fbbf24'; // sugerencia: dorado

        hexElements.push(
          <Hexagon key={id} cx={cx} cy={cy} size={size} color={color} onClick={() => handleHexClick(x, y, z)} />
        );
      }
    }
    return hexElements;
  };

  // Resolución de conflictos: Lógica de mensajes dinámica de master con clases CSS de estilosFinal
  let statusMessage: string;
  let statusClass: string;

  if (gameMode === 'pvp') {
    if (winner === 'human') {
      statusMessage = `¡${player1Name} GANA LA PARTIDA!`;
      statusClass = 'status-winner';
    } else if (winner === 'bot') {
      statusMessage = `¡${player2Name} GANA LA PARTIDA!`;
      statusClass = 'status-bot';
    } else if (pvpTurn === 'human') {
      statusMessage = `Turno de ${player1Name} (Azul)`;
      statusClass = 'status-human';
    } else {
      statusMessage = `Turno de ${player2Name} (Rojo)`;
      statusClass = 'status-bot';
    }
  } else {
    if (winner === 'human') {
      statusMessage = '¡HAS GANADO LA PARTIDA!';
      statusClass = 'status-winner';
    } else if (winner === 'bot') {
      statusMessage = 'El Bot te ha ganado...';
      statusClass = 'status-bot';
    } else if (isBotThinking) {
      statusMessage = 'El bot está pensando...';
      statusClass = 'status-bot';
    } else {
      statusMessage = 'Tu turno (Juegas con Azul)';
      statusClass = 'status-human';
    }
  }

  return (
    <div className="board-wrapper">
      {/* Barra de estado: usa clases dinámicas según el ganador o turno */}
      <p className={`board-status ${statusClass} ${winner ? 'winner-text' : ''}`}>
        {statusMessage}
      </p>

      {/* Tablero SVG con clase CSS externa */}
      <svg width={SVG_W} height={SVG_H} className="board-svg">
        {renderHexagons()}
      </svg>

      {/* Botón de sugerencia: aparece durante la partida. Una sugerencia por partida y jugador.
          En modo bot solo el humano puede pedirla; en PvP la pide quien tenga el turno actual. */}
      {!winner && (() => {
        const currentTurn: 'human' | 'bot' = gameMode === 'pvp' ? pvpTurn : 'human';
        const alreadyUsed = currentTurn === 'human' ? humanSuggestionUsed : pvpBotSuggestionUsed;
        const disabled = alreadyUsed || isFetchingSuggestion || isBotThinking;

        let label: string;
        if (isFetchingSuggestion) {
          label = 'Calculando sugerencia...';
        } else if (alreadyUsed) {
          label = 'Sugerencia ya utilizada';
        } else {
          label = 'Sugerir movimiento';
        }

        return (
          <button
            onClick={askSuggestion}
            disabled={disabled}
            style={{
              marginTop: '15px',
              padding: '8px 16px',
              backgroundColor: disabled ? '#9ca3af' : '#f59e0b',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: disabled ? 'not-allowed' : 'pointer',
              fontWeight: 'bold'
            }}
          >
            {label}
          </button>
        );
      })()}

      {/* Botón de reinicio: solo aparece cuando la partida ha terminado */}
      {winner && (
        <button onClick={resetGame} className="btn-play">
          {t('board.playAgain')}
        </button>
      )}
    </div>
  );
};