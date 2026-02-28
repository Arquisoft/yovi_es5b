import React, { useState } from 'react';

interface RegisterFormProps {
  onRegisterSuccess: (username: string) => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onRegisterSuccess }) => {
  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

const handleSubmit = async (event: React.FormEvent) => { // Añadimos async
    event.preventDefault();
    setError(null);

    // Validación local básica
    if (!fullName.trim() || !username.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);

    try {
      // 1. Llamada al User Service
      // Nota: Asegúrate de que API_URL es "http://localhost:3000"
      const response = await fetch('http://localhost:3000/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nombre: fullName,      // Mapeamos a lo que espera el validador
          nom_usuario: username, // Mapeamos a lo que espera el validador
          contrasena: password   // Mapeamos a lo que espera el validador
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Registro exitoso
        onRegisterSuccess(data.nom_usuario);
      } else {
        // Error de validación (ej: contraseña corta o usuario duplicado)
        // Si el backend devuelve un objeto de errores, mostramos el primero
        const errorMsg = data.error || Object.values(data)[0] || 'Error en el registro';
        setError(typeof errorMsg === 'string' ? errorMsg : 'Datos inválidos');
      }
    } catch (err) {
      console.error("Error de conexión:", err);
      setError('No se pudo conectar con el servidor de usuarios.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <form onSubmit={handleSubmit} className="register-form">
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

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Registrando...' : 'Aceptar Registro'}
      </button>
    </form>
  );
};

export default RegisterForm;