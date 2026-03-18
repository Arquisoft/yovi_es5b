
import { useState, useEffect } from "react";
import GamePage from "../pages/GamePage";
import RegisterPage from "../pages/RegisterPage";
import "../css/Estilo.css"; 

import type {User} from "../types/user";


const StartPage = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);


  useEffect(() => {
    setLoading(true);
    const fetchUser = async () => {
      try {
        const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        const res = await fetch(`${USERS_URL}/getuser`, {credentials: "include"});
        if (res.status === 403) {
            // Usuario no autenticado
            setUser(null);
        } else {
            // Se asume usuario autenticado
            const data = await res.json();
            setUser(data);
        }
      } catch (err) {
        console.error('Error obteniendo el usuario autenticado', err);
      }
    };
    fetchUser().finally(() => setLoading(false));
  }, []);

  if (loading) {
      return <p>Cargando...</p>;
  }

  // Redirigir usuario autenticado al juego
  if (user !== null) {
      return <GamePage user={user}/>;
  }

  // Redirigir usuario no autenticado al registro
  return <RegisterPage/>;

};

export default StartPage;
