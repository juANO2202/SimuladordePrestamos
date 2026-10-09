import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Lock, User, Mail, Eye, EyeOff, AlertCircle, UserPlus } from 'lucide-react';

export const RegisterPage = ({ onSwitchToLogin }) => {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [serverErrors, setServerErrors] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setServerErrors([]);

    if (!username.trim() || !email.trim() || !password) {
      setError('Por favor complete todos los campos requeridos.');
      return;
    }

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    setLoading(true);
    try {
      const res = await register(username, email, password);
      if (!res.success) {
        setError(res.message || 'No se pudo completar el registro.');
        if (res.errors && res.errors.length > 0) {
          setServerErrors(res.errors);
        }
      }
    } catch {
      setError('Ocurrió un error de conexión al servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card page">
        <div className="auth-head">
          <div className="brand-mark"><Landmark size={28} /></div>
          <h1 className="title">Crea tu cuenta</h1>
          <p className="subhead">Guarda tus simulaciones y consúltalas cuando quieras.</p>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <div>
              {error}
              {serverErrors.length > 0 && (
                <ul>
                  {serverErrors.map((err, i) => <li key={i}>{err}</li>)}
                </ul>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="reg-user">Nombre de usuario</label>
            <div className="field">
              <User size={18} />
              <input
                id="reg-user"
                type="text"
                className="form-input with-icon"
                placeholder="ej: juanperez"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Correo electrónico</label>
            <div className="field">
              <Mail size={18} />
              <input
                id="reg-email"
                type="email"
                className="form-input with-icon"
                placeholder="juan.perez@ejemplo.com"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-pass">Contraseña</label>
            <div className="field">
              <Lock size={18} />
              <input
                id="reg-pass"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon with-action"
                placeholder="Mínimo 6 caracteres"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="field-action"
                onClick={() => setShowPassword(!showPassword)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="btn btn-primary btn-lg btn-block" disabled={loading}>
            {loading ? 'Registrando…' : <><UserPlus size={18} /> Crear cuenta</>}
          </button>
        </form>

        <div className="auth-foot">
          ¿Ya tienes cuenta?{' '}
          <button type="button" className="link-button" onClick={onSwitchToLogin}>
            Inicia sesión
          </button>
        </div>
      </div>
    </div>
  );
};
