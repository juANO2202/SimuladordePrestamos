import React, { createContext, useContext, useState, useEffect } from 'react';
import { apiFetch, setAuthToken, removeAuthToken, getAuthToken } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('simulator_user');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = getAuthToken();
      if (token) {
        try {
          const res = await apiFetch('/auth/me');
          if (res && res.success && res.data) {
            const userData = {
              username: res.data.username,
              email: res.data.email
            };
            setUser(userData);
            localStorage.setItem('simulator_user', JSON.stringify(userData));
          } else if (res && res.status === 401) {
            // Token inválido o vencido: limpiar la sesión guardada
            removeAuthToken();
            localStorage.removeItem('simulator_user');
            setUser(null);
          }
        } catch (err) {
          console.warn('Error al verificar sesión con backend:', err);
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (usernameOrEmail, password) => {
    const res = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ usernameOrEmail, password })
    });

    if (res && res.success && res.data?.token) {
      setAuthToken(res.data.token);
      const userData = {
        username: res.data.username,
        email: res.data.email
      };
      setUser(userData);
      localStorage.setItem('simulator_user', JSON.stringify(userData));
      return { success: true };
    }

    return {
      success: false,
      message: res?.message || 'Credenciales de acceso no válidas.',
      errors: res?.errors
    };
  };

  const register = async (username, email, password) => {
    const res = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password })
    });

    if (res && res.success && res.data?.token) {
      setAuthToken(res.data.token);
      const userData = {
        username: res.data.username,
        email: res.data.email
      };
      setUser(userData);
      localStorage.setItem('simulator_user', JSON.stringify(userData));
      return { success: true };
    }

    return {
      success: false,
      message: res?.message || 'No se pudo completar el registro de usuario.',
      errors: res?.errors
    };
  };

  const logout = () => {
    removeAuthToken();
    localStorage.removeItem('simulator_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de un AuthProvider');
  }
  return context;
};
