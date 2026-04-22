import { useState, useEffect } from "react";
import GamePage from "../pages/GamePage";
import RegisterPage from "../pages/RegisterPage";
import "../css/Estilo.css"; 
import { useTranslation } from 'react-i18next';

import type { User } from "../types/user";


//La única misión de esta clase es decidir qué pantalla debe ver el usuario nada más abrir la web.
const StartPage = () => {
  const { t } = useTranslation();

  // Estado para almacenar los datos del usuario si está logueado
  const [user, setUser] = useState<User | null>(null);
  
  // Estado para controlar el tiempo de espera mientras el servidor responde
  // Empieza en true porque lo primero que hacemos es preguntar al servidor
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {

    //Función asíncrona para verificar si existe una sesión activa (cookie)
    const fetchUser = async () => {
      try {
        // Obtenemos la URL del backend desde las variables de entorno o usamos el localhost por defecto
        const USERS_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
        
        // Llamada al endpoint /getuser. 
        //'credentials: "include"' es necesario para enviar las cookies de sesión al servidor
        const res = await fetch(`${USERS_URL}/getuser`, { credentials: "include" });
        
        if (res.ok) {
            // Si el servidor responde 200 OK, guardamos los datos del usuario
            const data = await res.json();
            setUser(data);
        } else if (res.status === 403) {
            // Si responde 403, significa que no hay sesión o ha expirado
            setUser(null);
        }
      } catch (err) {
        // Si hay un error de red o el servidor está caído
        console.error('Error obteniendo el usuario autenticado', err);
        setUser(null);
      } finally {
        // Pase lo que pase (éxito o error), quitamos la pantalla de carga
        setLoading(false);
      }
    };

    fetchUser();
  }, []); // El array vacío indica que esto solo se ejecuta al cargar la página por primera vez

  // Mientras esperamos la respuesta del servidor (evita parpadeos de login/registro)
  if (loading) {
    return (
      <div className="lobby-container">
        <p>{t('start.loadingSession')}</p>
      </div>
    );
  }

  //Si el servidor confirmó que el usuario tiene una sesión válida
  if (user !== null) {
    return <GamePage user={user} />;
  }

  //Si no hay usuario mostramos la pantalla de acceso
  return <RegisterPage />;
};

export default StartPage;