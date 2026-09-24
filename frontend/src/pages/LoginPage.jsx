import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, Lock, User, Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';

export const LoginPage = () => {
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
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '420px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            display: 'inline-flex',
            padding: '0.85rem',
            borderRadius: '50%',
            background: '#f1f5f9',
            marginBottom: '1rem'
          }}>
            <Landmark size={32} color="#0f172a" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#0f172a', marginBottom: '0.2rem' }}>
            Acceso al Simulador
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Ingresa directamente con tus credenciales
          </p>
        </div>

        <div style={{
          background: '#f8fafc',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0.75rem 1rem',
          marginBottom: '1.5rem',
          fontSize: '0.82rem',
          color: '#475569',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <CheckCircle2 size={16} color="#0f172a" style={{ flexShrink: 0 }} />
          <div>
            <strong>Usuario precargado:</strong> admin<br />
            <strong>Contraseña:</strong> password123
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <div>{error}</div>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Usuario o Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="ej: admin"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                required
              />
              <Lock size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '0.9rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#94a3b8'
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1.25rem', padding: '0.85rem' }}
            disabled={loading}
          >
            {loading ? 'Ingresando...' : (
              <>
                Ingresar al Simulador <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
