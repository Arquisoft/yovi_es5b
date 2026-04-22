import { useState } from 'react';
import { Board } from '../components/Board'; 
import type { User } from "../types/user";
import { useTranslation } from 'react-i18next';

// Mantén tus diccionarios de mapeo
type DifficultyLevel = 'easy' | 'medium' | 'hard';

const urlToDifficulty: Record<string, DifficultyLevel> = {
  'random_bot': 'easy',
  'mediumbot': 'medium',
  'bridgebot': 'hard',
};

type PlayPageProps = {
    user: User;
    botId: string;
    boardSize: number;
    onBackToLobby: any;
};

const PlayPage = ({ user, botId, boardSize, onBackToLobby }: PlayPageProps) => {
  const { t } = useTranslation();
  // Inicializa basándose en botId recibido como prop
  const initialDifficulty = urlToDifficulty[botId] || 'easy';
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(initialDifficulty);
  const [gameKey, setGameKey] = useState(0);

  const handleAbandon = async () => {
    onBackToLobby();
  };

  // Handler que soporta las 3 dificultades
  const handleChangeDifficulty = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newDifficulty = event.target.value as DifficultyLevel;
    setDifficulty(newDifficulty);
    setGameKey(prev => prev + 1);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 20px', marginBottom: '20px' }}>
        <h2>{t('play.titlePrefix')} <strong>{user.nom_usuario || t('play.defaultPlayer')}</strong></h2>
        
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <select 
            value={difficulty} 
            onChange={handleChangeDifficulty}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#3b82f6', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer',
              fontWeight: 'bold',
            }}
          >
            <option value="easy">{t('play.difficultyEasy')}</option>
            <option value="medium">{t('play.difficultyMedium')}</option>
            <option value="hard">{t('play.difficultyHard')}</option>
          </select>
          
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
            {t('play.abandon')}
          </button>
        </div>
      </div>
      
      <p style={{ marginBottom: '30px', fontSize: '18px' }}>{t('play.turnHelp')}</p>

      <div key={gameKey} style={{ 
        padding: '20px', 
        backgroundColor: '#ffffff', 
        borderRadius: '12px', 
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)' 
      }}>
        <Board botId={botId} difficulty={difficulty} boardSize={boardSize}/>
      </div>

        <div>
        <h3>{t('play.rulesTitle')}</h3>
        <p>
          {t('play.rulesTextBeforeHighlight')} <strong>{t('play.rulesTextHighlight')}</strong>{t('play.rulesTextAfterHighlight')}
        </p>
      </div>

    </div>
  );
};

export default PlayPage;
