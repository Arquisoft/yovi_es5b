import React, { useState } from 'react';

interface LogInFormProps {
  onLoginSuccess: (username: string) => void;
}

const LogInForm: React.FC<LogInFormProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('Por favor, rellena todos los campos.');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      onLoginSuccess(username);
      setLoading(false);
    }, 500);
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
        {loading ? 'Iniciando Sesión...' : 'Aceptar Inicio de Sesión'}
      </button>
    </form>
  );
};

export default LogInForm;