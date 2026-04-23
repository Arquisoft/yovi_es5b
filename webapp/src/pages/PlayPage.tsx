import { useState } from 'react';
import { Board } from '../components/Board';
import type { User } from "../types/user";
import { useTranslation } from 'react-i18next';
import '../css/Estilo.css';


// Dificultades de los bots
type DifficultyLevel = 'easy' | 'medium' | 'hard';


type PlayPageProps = {
    user: User;
    botId: string;
    boardSize: number;
    // Modo de juego recibido del lobby: determina si se juega contra bot o contra otro jugador
    gameMode: 'bot' | 'pvp';
    // Nombre del segundo jugador en modo PvP (por defecto 'Invitado' si se dejó vacío en el lobby)
    player2Name: string;
    onBackToLobby: any;
    onChangeDifficulty: any;
};

const PlayPage = ({ user, botId, boardSize, gameMode, player2Name, onBackToLobby, onChangeDifficulty }: PlayPageProps) => {
  const { t } = useTranslation();
  // Inicializa basándose en botId recibido como prop
  const initialDifficulty = botId || 'random_bot';
  const [difficulty, setDifficulty] = useState<string>(initialDifficulty);
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = async () => {
    onBackToLobby();
  };

  // Handler que soporta las 3 dificultades
  const handleChangeDifficulty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel;
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1);
    onChangeDifficulty(newDifficulty);
  };

  return (
    <div className='lobby-container'>
      <div className='play-header'>
        <h2 className='play-title'>
          {gameMode === 'pvp' ? (
            <>
              <strong>{user.nom_usuario || t('play.defaultPlayer1')}</strong> {t('play.versus')} <strong>{player2Name}</strong>
            </>
          ) : (
            <>
              {t('play.titlePrefix')} <strong>{user.nom_usuario || t('play.defaultPlayer')}</strong>
            </>
          )}
        </h2>

        <div className='auth-selector'>
          {gameMode === 'bot' && (
            <select value={difficulty} onChange={handleChangeDifficulty} className='combobox'>
              <option value='random_bot'>{t('play.difficultyEasy')}</option>
              <option value='mediumbot'>{t('play.difficultyMedium')}</option>
              <option value='bridgebot'>{t('play.difficultyHard')}</option>
            </select>
          )}

          <button onClick={handleAbandon} className='btn-logout'>
            {t('play.abandon')}
          </button>
        </div>
      </div>

      <p className='turn-indicator'>
        {gameMode === 'pvp' ? t('play.turnHelpPvp') : t('play.turnHelp')}
      </p>

      <div key={gameKey} className='card board-container'>
        <Board
          botId={botId}
          boardSize={boardSize}
          gameMode={gameMode}
          player1Name={user.nom_usuario || t('play.defaultPlayer1')}
          player2Name={player2Name}
        />
      </div>

      <div className='info-section'>
        <h3>{t('play.rulesTitle')}</h3>
        <p>
          {t('play.rulesTextBeforeHighlight')} <strong>{t('play.rulesTextHighlight')}</strong>
          {t('play.rulesTextAfterHighlight')}
        </p>
      </div>
    </div>
  );
};

export default PlayPage;
