import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, Info } from 'lucide-react';

export const LoginPage = ({ onSwitchToRegister }) => {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState('admin');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!usernameOrEmail.trim() || !password) {
      setError('Por favor ingrese su usuario/correo y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const res = await login(usernameOrEmail, password);
      if (!res.success) {
        setError(res.message || 'Error al iniciar sesión.');
      }
    } catch {
      setError('Ocurrió un fallo de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="card auth-card page">
        <div className="auth-head">
          <div className="brand-mark"><Landmark size={28} /></div>
          <h1 className="title">Bienvenido</h1>
          <p className="subhead">Inicia sesión para simular y guardar tus créditos.</p>
        </div>

        <div className="auth-note">
          <Info size={16} />
          <div>Cuenta de demostración: <strong>admin</strong> / <strong>password123</strong></div>
        </div>

        {error && (
          <div className="alert alert-error" role="alert">
            <AlertCircle size={18} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="login-user">Usuario o correo electrónico</label>
            <div className="field">
              <User size={18} />
              <input
                id="login-user"
                type="text"
                className="form-input with-icon"
                placeholder="ej: admin"
                autoComplete="username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-pass">Contraseña</label>
            <div className="field">
              <Lock size={18} />
              <input
                id="login-pass"
                type={showPassword ? 'text' : 'password'}
                className="form-input with-icon with-action"
                placeholder="••••••••"
                autoComplete="current-password"
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
            {loading ? 'Ingresando…' : <>Ingresar <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="auth-foot">
          ¿No tienes cuenta?{' '}
          <button type="button" className="link-button" onClick={onSwitchToRegister}>
            Regístrate
          </button>
        </div>
      </div>
    </div>
  );
};
