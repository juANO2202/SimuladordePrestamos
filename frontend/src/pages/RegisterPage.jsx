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
    <div style={{
      minHeight: '75vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem'
    }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '440px', padding: '2.5rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
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
            Registro de Usuario
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.9rem' }}>
            Crea tu cuenta para simular y guardar tus préstamos
          </p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '700' }}>
              <AlertCircle size={18} />
              {error}
            </div>
            {serverErrors.length > 0 && (
              <ul style={{ paddingLeft: '1.5rem', marginTop: '0.5rem', fontSize: '0.85rem' }}>
                {serverErrors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Nombre de Usuario</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                placeholder="ej: juanperez"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <User size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Correo Electrónico</label>
            <div style={{ position: 'relative' }}>
              <input
                type="email"
                className="form-input"
                placeholder="juan.perez@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ paddingLeft: '2.5rem' }}
                required
              />
              <Mail size={18} color="#94a3b8" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Contraseña</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                className="form-input"
                placeholder="Mínimo 6 caracteres"
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
            {loading ? 'Registrando...' : (
              <>
                <UserPlus size={18} /> Crear Cuenta
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid #f1f5f9', fontSize: '0.88rem', color: '#64748b' }}>
          ¿Ya tienes cuenta?{' '}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none',
              border: 'none',
              color: '#0f172a',
              fontWeight: '700',
              cursor: 'pointer',
              textDecoration: 'underline'
            }}
          >
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
};
