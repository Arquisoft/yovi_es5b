import React, { useState } from 'react';
import '../../css/Estilo.css'; 

interface LogInFormProps {
  //Notificamos al componente padre que las credenciales son válidas
  onLoginSuccess: (username: string) => void;
}

const LogInForm: React.FC<LogInFormProps> = ({ onLoginSuccess }) => {
  // Estados para capturar las credenciales del usuario
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados para manejar el feedback visual
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

   //Manejador del inicio de sesión, realiza una petición POST al microservicio de usuarios.
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Evita la recarga de la página
    setError(null);         // Limpia intentos anteriores

    //Antes de ir al servidor, comprobamos que no haya campos vacíos
    if (!username.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true); // Desactiva el botón mientras esperamos respuesta

    try {
      //Enviamos los datos al puerto 3000 donde corre el microservicio de usuarios.
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_usuario: username, // Clave esperada por el validador del backend
          contrasena: password   // Clave esperada por el validador del backend
        }),
      });

      const data = await response.json();

      if (response.ok) {
        //Las credenciales son correctas y el backend ha generado la sesión.
        onLoginSuccess(data.nom_usuario);
      } else {
        //Credenciales incorrectas o usuario no encontrado.
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      //Fallo en la red o servidor caído.
      console.error("Error en login:", err);
      setError('No se pudo conectar con el servidor de usuarios.');
    } finally {
      setLoading(false); // Restablece el estado del botón
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/* Campo de entrada para el usuario */}
      <div className="form-group">
        <label htmlFor="login-username">Nombre de Usuario:</label>
        <input
          type="text"
          id="login-username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Campo de entrada para la contraseña */}
      <div className="form-group">
        <label htmlFor="login-password">Contraseña:</label>
        <input
          type="password"
          id="login-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Muestra de errores dinámicos con la clase CSS externa */}
      {error && <div className="error-message">{error}</div>}

      {/* Botón de acción con feedback de estado */}
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

export default LogInForm;