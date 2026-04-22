import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import '../css/Estilo.css';

// Interfaz para las propiedades que recibe el componente
interface EstadisticasProps {
  user: User;
  onBack: () => void;
}

// Interfaz para los datos de estadísticas
interface StatsData {
  jugadas: number;
  ganadas: number;
  perdidas: number;
}

// Interfaz que describe cada fila del ranking
interface RankingEntry {
  nom_usuario: string;
  nombre: string;
  jugadas: number;
  ganadas: number;
}

const Estadisticas: React.FC<EstadisticasProps> = ({ user, onBack }) => {
  // URL del microservicio de usuarios
  const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

  // Estado para guardar las estadísticas, empezamos en 0
  const [stats, setStats] = useState<StatsData>({ jugadas: 0, ganadas: 0, perdidas: 0 });
  
  // Estado para controlar si estamos cargando datos
  const [loading, setLoading] = useState(true);
  
  // Estado para guardar los datos del ranking, inicialmente vacío
  const [ranking, setRanking] = useState<RankingEntry[]>([]);

  // Estado para mostrar las stats propias o el ranking, por defecto las stats propias
  const [showRanking, setShowRanking] = useState(false);
  
  useEffect(() => {
    // Función para pedir las estadísticas al backend
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        // Llamada al endpoint de estadísticas usando el nom_usuario
        const response = await fetch(`${USERS_URL}/stats/${user.nom_usuario}`, {
          method: 'GET',
          credentials: "include",
        });

        // Si la respuesta es correcta, guardamos los datos
        if (response.ok) {
          const data = await response.json();
          setStats(data);  // Guardamos datos si la respuesta es correcta
        }
      } catch {
        // Si hay error (backend no listo), avisamos por consola y dejamos los ceros
        console.warn("Backend no listo, mostrando ceros por defecto.");
      } finally {
        // Al terminar (bien o mal), quitamos el estado de carga
        setLoading(false);
      }
    };

    fetchUserStats();
  }, [user.nom_usuario]);

  const fetchRanking = async () => {
    const response = await fetch(`${USERS_URL}/ranking`, { credentials: 'include' });
    if (response.ok) {
        const data = await response.json();
        console.log('Datos ranking:', data);
        
        setRanking(await response.json()); // guarda los datos en el estado
    }
    setShowRanking(true); // cambia la vista al ranking
  };

  return (
    <div className='lobby-container'>
      {/* Título con el nombre del usuario */}
      <h2>Estadísticas de {user.nombre}</h2> 
      
      {/* Vista para cuando la página está cargando */} 
      {loading ? (
        <div className="status-badge checking">Cargando datos...</div>
      ) : showRanking ? (
        /* Vista para ranking */
        <div className="card stats-card">
          <h2>Ranking global</h2>
          <table style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>#</th>
                <th>Usuario</th>
                <th>Jugadas</th>
                <th>Ganadas</th>
              </tr>
            </thead>
            <tbody>
              {ranking.map((entry, i) => (
                <tr key={entry.nom_usuario}
                  style={{ fontWeight: entry.nom_usuario === user.nom_usuario ? 'bold' : 'normal' }}>
                  <td>{i + 1}</td>
                  <td>{entry.nom_usuario}</td>
                  <td>{entry.jugadas}</td>
                  <td>{entry.ganadas}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={() => setShowRanking(false)} className="btn-play">
              Ver mis estadísticas
          </button>
        </div>
      ) : (
        /* Vista para estadísitcas del usuario */
        <div className="card">
          {/* Fila de partidas totales */}
          <div className="stats">
            <label><strong>Partidas jugadas</strong></label>
            <div className="stats-played">
              {stats.jugadas}
            </div>
          </div>
          
          {/* Fila de victorias */}
          <div className="stats"> 
            <label><strong>Partidas ganadas</strong></label>
            <div className="stats-won">
              {stats.ganadas}
            </div>
          </div>
          
          {/* Fila de derrotas */}
          <div className="stats"> 
            <label><strong>Partidas perdidas</strong></label>
            <div className="stats-lost">
              {stats.perdidas}
            </div>
          </div>

          {/* Botón para ver el ranking */}
          <button onClick={fetchRanking} className="btn-play">
            Ver ranking global
          </button>
        </div>
      )}
      
      {/* Botón para regresar al lobby */}
      <button onClick={onBack} className="btn-play">
        Volver al Menú
      </button>
    </div>
  );
};

export default Estadisticas;