import React, { useState } from 'react';
import '../../css/Estilo.css'; // Importación de los estilos relegados al fichero CSS

interface RegisterFormProps {
  // Callback para comunicar al componente padre que el registro fue exitoso
  onRegisterSuccess: (username: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  //Estados del formulario
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  
  // Estados auxiliares para feedback visual y errores
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  //Manejador del envío del formulario, se marca como 'async' porque realiza una petición de red (fetch).
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault(); // Evita que la página se recargue al enviar
    setError(null);         // Limpiamos errores previos

    //Antes de ir al servidor, comprobamos que no haya campos vacíos
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true); // Bloqueamos el botón para evitar múltiples clics

    try {
      //Enviamos los datos al puerto 3000 donde corre el microservicio de usuarios.
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        //Convertimos las variables de React a los nombres que espera el backend (nombre, nom_usuario, contrasena)
        body: JSON.stringify({
          nombre: fullName,      
          nom_usuario: username, 
          contrasena: password   
        }),
      });

      const data = await response.json();

      if (response.ok) {
        //Si se ha registrado correctamente, informamos al componente padre del éxito del registro.
        onRegisterSuccess(data.nom_usuario);
      } else {
        //El backend rechazó la petición
        const errorMsg = data.error || Object.values(data)[0] || 'Error en el registro';
        setError(typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos');
      }
    } catch (err) {
      //Se lanza error si no se pudo alcanzar el servidor 
      console.error("Error de conexión:", err);
      setError('No se pudo conectar con el servidor de usuarios.');
    } finally {
      setLoading(false); // Liberamos el estado de carga
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
      {/*Nombre Completo */}
      <div className="form-group">
        <label htmlFor="fullName">Nombre Completo:</label>
        <input
          type="text"
          id="fullName"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="form-input"
        />
      </div>

      {/*Nombre de Usuario */}
      <div className="form-group">
        <label htmlFor="username">Nombre de Usuario:</label>
        <input
          type="text"
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="form-input"
        />
      </div>

      {/*Contraseña */}
      <div className="form-group">
        <label htmlFor="password">Contraseña:</label>
        <input
          type="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="form-input"
        />
      </div>

      {/* Muestra de errores dinámicos usando la clase del CSS externo */}
      {error && <div className="error-message">{error}</div>}

      {/* Botón de acción con estado de carga */}
      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Registrando...' : 'Aceptar Registro'}
      </button>
    </form>
  );
};

export default RegisterForm;