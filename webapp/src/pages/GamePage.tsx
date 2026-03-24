import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
const ROUTES = {
  HOME: '/',
  PLAY_PATH: (username: string) => `/play/${username}`
};
import '../css/Estilo.css'; 

const GamePage: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const navigate = useNavigate();
  
  // Estados existentes: comprobando, todo correcto o ha ocurrido un error. Comprobando por defecto
  const [gameyStatus, setGameyStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  
  const [mode, setMode] = useState('bot'); // Se juega contra bot o jugador?
  const [strategy, setStrategy] = useState('random'); // DIficultad del bot
  const [size, setSize] = useState('15'); // Tamaño del tablero

  useEffect(() => {
    // Función que pregunta al microservicio de juego si está activo
    const checkGameyStatus = async () => {
      try {
        //Enviamos los datos al puerto 4000 donde corre el microservicio de juego.
        const GAMEY_URL = import.meta.env.VITE_GAMEY_URL ?? 'http://localhost:4000';
        const res = await fetch(`${GAMEY_URL}/status`, {});
        const data = await res.text();
        setGameyStatus(res.ok && data.trim() === 'OK' ? 'ok' : 'error'); //Cambia el gameyStatus en función de la conexión
      } catch (err) {
            // En caso de caída de red o servidor, marcamos error
            console.error('Error checking Gamey status:', err); 
            setGameyStatus('error');
      }
    };
    checkGameyStatus();
    // Vigilamos la conexión cada 5 segundos por si el servidor se cae
    const interval = setInterval(checkGameyStatus, 5000);
    // Limpiamos el intervalo al salir de la página para no saturar el navegador
    return () => clearInterval(interval);
  }, []);

  // Función para volver al inicio borrando el rastro de la partida
  const handleLogout = () => navigate(ROUTES.HOME);
  
  // Enviamos al usuario a la partida con sus preferencias vía URL
  const handleStartGame = () => {
    if (username) {
      navigate(`${ROUTES.PLAY_PATH(username)}?bot=${strategy}&size=${size}`);
    }
  };

  /*if (playGame) {
      return <PlayPage botId={botId} user={user} onBackToLobby={handleBackToLobby}/>;
  }*/

  return (
    <div className="lobby-container">
      {/* Cabecera con estado de conexión y acciones */}
      <header className="lobby-header">
        <div className={`status-badge ${gameyStatus}`}>
          {gameyStatus === 'ok' ? 'Conectado' : 'Desconectado'}
        </div>
        <div className="header-actions">
          <button className="btn-secondary">Hist</button>
          <button onClick={handleLogout} className="btn-logout">← Logout</button>
        </div>
      </header>

      <main className="lobby-main">
        {/* Identificador visual del usuario */}
        <div className="avatar-circle">
          <img 
            src="/../Logo.jpeg" 
            alt="Logo Juego Y" 
          />
        </div>
        <p>Bienvenido, <strong>{username}</strong></p>

        {/* Selectores para configurar la partida */}
        <div className="selectors-container">
          <select value={mode} onChange={(e) => setMode(e.target.value)} className="lobby-select">
            <option value="bot">Contra Bot</option>
            <option value="player">Contra Jugador</option>
          </select>

          <select value={strategy} onChange={(e) => setStrategy(e.target.value)} className="lobby-select">
            <option value="random_bot">Bot Aleatorio (Fácil)</option>
            <option value="smart_bot">Bot Inteligente (Difícil)</option>
          </select>

          <select value={size} onChange={(e) => setSize(e.target.value)} className="lobby-select">
            <option value="15">Tamaño: 15 casillas</option>
            <option value="30 casillas">Tamaño: 30</option>
          </select>
        </div>

        {/* Solo permitimos jugar si el servidor Gamey responde */}
        <button 
          onClick={handleStartGame} 
          className="btn-play"
          disabled={gameyStatus !== 'ok'}
        >
          JUGAR
        </button>
      </main>

      {/* Pie de página con la versión del proyecto */}
      <footer className="lobby-footer">YGV15 B</footer>
    </div>
  );
};

export default GamePage;