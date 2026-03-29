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

const Estadisticas: React.FC<EstadisticasProps> = ({ user, onBack }) => {
  // Estado para guardar las estadísticas, empezamos en 0
  const [stats, setStats] = useState<StatsData>({ jugadas: 0, ganadas: 0, perdidas: 0 });
  // Estado para controlar si estamos cargando datos
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función para pedir las estadísticas al backend
    const fetchUserStats = async () => {
      setLoading(true);
      try {
        // URL del microservicio de usuarios
        const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        
        // Llamada al endpoint de estadísticas usando el nom_usuario
        const response = await fetch(`${USERS_URL}/stats/${user.nom_usuario}`, {
          method: 'GET',
          credentials: "include",
        });

        // Si la respuesta es correcta, guardamos los datos
        if (response.ok) {
          const data = await response.json();
          setStats(data);
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

  return (
    <div className="lobby-container stats-view">
      {/* Título con el nombre del usuario */}
      <h1 className="stats-title">Estadísticas de {user.nombre}</h1> 
      
      {/* Si está cargando muestra el badge, si no muestra la tarjeta de datos */}
      {loading ? (
        <div className="status-badge checking">Cargando datos...</div>
      ) : (
        <div className="card stats-card">
          {/* Fila de partidas totales */}
          <div className="stats-row">
            <span className="stats-label">Partidas jugadas</span>
            <span className="stats-number">{stats.jugadas}</span>
          </div>
          
          {/* Fila de victorias */}
          <div className="stats-row">
            <span className="stats-label">Partidas ganadas</span>
            <span className="stats-number win-text">{stats.ganadas}</span>
          </div>
          
          {/* Fila de derrotas */}
          <div className="stats-row">
            <span className="stats-label">Partidas perdidas</span>
            <span className="stats-number lose-text">{stats.perdidas}</span>
          </div>
        </div>
      )}
      
      {/* Botón para regresar al lobby */}
      <button onClick={onBack} className="btn-play stats-back-btn">
        Volver al Menú
      </button>
    </div>
  );
};

export default Estadisticas;