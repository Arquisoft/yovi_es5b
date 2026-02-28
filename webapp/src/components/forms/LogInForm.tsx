import React, { useState } from 'react';

interface LogInFormProps {
  onLoginSuccess: (username: string) => void;
}

const LogInForm: React.FC<LogInFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('http://localhost:3000/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nom_usuario: username, 
          contrasena: password   
        }),
      });

      const data = await response.json();

      if (response.ok) {
        onLoginSuccess(data.nom_usuario);
      } else {
        setError(data.error || 'Credenciales incorrectas');
      }
    } catch (err) {
      console.error("Error en login:", err);
      setError('No se pudo conectar con el servidor de usuarios.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="register-form">
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

      {error && <div style={{ color: 'red', marginTop: '10px' }}>{error}</div>}

      <button type="submit" className="submit-button" disabled={loading}>
        {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
      </button>
    </form>
  );
};

export default LogInForm;