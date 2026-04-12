import React, { useState, useEffect } from 'react';
import type { User } from '../types/user';
import '../css/Estilo.css';

interface EstadisticasProps {
  user: User;
  onBack: () => void;
}

interface StatsData {
  jugadas: number;
  ganadas: number;
  perdidas: number;
}

const Estadisticas: React.FC<EstadisticasProps> = ({ user, onBack }) => {
  const [stats, setStats] = useState<StatsData>({ jugadas: 0, ganadas: 0, perdidas: 0 }); // Estado inicial
  const [loading, setLoading] = useState(true); // Estado de carga inicial

  useEffect(() => {
    // Función para obtener datos del backend
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const response = await fetch(`${USERS_URL}/stats/${user.nom_usuario}`, {
          method: 'GET',
          credentials: "include",
        });

        if (response.ok) {
          const data = await response.json();
          setStats(data); // Guardamos datos si la respuesta es correcta
        }
      } catch {
        console.warn("Backend no listo, mostrando ceros por defecto."); // Fallback a ceros
      } finally {
        setLoading(false); // Finalizamos carga
      }
    };

    fetchUserStats();
  }, [user.nom_usuario]);

  return (
    <div className='lobby-container'> {/* Reutiliza el centrado maestro */}
      <h2>Estadísticas de {user.nombre}</h2> {/* Reutiliza el estilo de título blanco */}
      
      {loading ? (
        <div className="status-badge checking">Cargando datos...</div> // Reutiliza el badge de carga
      ) : (
        <div className="card"> {/* Reutiliza la tarjeta blanca con padding y sombras */}
          
          <div className="stats"> {/* Reutiliza la estructura de fila para Partidas Jugadas */}
            <label><strong>Partidas jugadas</strong></label>
            <div className="stats-played">
              {stats.jugadas}
            </div> 
          </div>
          
          <div className="stats"> 
            <label><strong>Partidas ganadas</strong></label>
            <div className="stats-won">
              {stats.ganadas}
            </div>
          </div>
          
          <div className="stats"> 
            <label><strong>Partidas perdidas</strong></label>
            <div className="stats-lost">
              {stats.perdidas}
            </div>
          </div>

        </div>
      )}
      
      {/* Reutiliza el botón verde de JUGAR para Volver al Menú */}
      <button onClick={onBack} className="btn-play" style={{ marginTop: '2rem', maxWidth: '22rem' }}>
        VOLVER AL MENÚ
      </button>
    </div>
  );
};

export default Estadisticas;