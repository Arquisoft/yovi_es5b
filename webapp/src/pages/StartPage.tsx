import { useState, useEffect } from "react";
import GamePage from "../pages/GamePage";
import RegisterPage from "../pages/RegisterPage";
import "../css/Estilo.css"; 

import type { User } from "../types/user";

const StartPage = () => {
  const [user, setUser] = useState<User | null>(null);
  // El estado ya empieza en true, no hace falta setearlo en el useEffect
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const res = await fetch(`${USERS_URL}/getuser`, { credentials: "include" });
        
        if (res.ok) {
            const data = await res.json();
            setUser(data);
        } else if (res.status === 403) {
            setUser(null);
        }
      } catch (err) {
        console.error('Error obteniendo el usuario autenticado', err);
        setUser(null);
      } finally {
        // Esto siempre se ejecuta al final, sea éxito o error
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // Se ejecuta una sola vez al montar el componente

  if (loading) {
    return (
      <div className="lobby-container">
        <p>Cargando sesión...</p>
      </div>
    );
  }

  // Si hay usuario, al juego directamente
  if (user !== null) {
    return <GamePage user={user} />;
  }

  // Si no, a la página de registro/login
  return <RegisterPage />;
};

export default StartPage;