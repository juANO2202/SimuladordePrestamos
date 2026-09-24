import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, LogOut, Calculator, History } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <>
      <div className="top-accent-bar"></div>
      <nav className="navbar">
        <div className="navbar-inner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <a href="#" className="brand-logo" onClick={() => setActiveTab('simulator')}>
              <Landmark size={26} color="#0f172a" />
              <span>SIMULADOR DE PRÉSTAMOS</span>
            </a>

            {user && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  className={`btn ${activeTab === 'simulator' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => setActiveTab('simulator')}
                >
                  <Calculator size={15} />
                  Simulador
                </button>
                <button
                  className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.45rem 0.9rem', fontSize: '0.85rem' }}
                  onClick={() => setActiveTab('history')}
                >
                  <History size={15} />
                  Mis Simulaciones
                </button>
              </div>
            )}
          </div>

          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
                <div style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: '#0f172a',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: '700',
                  fontSize: '0.85rem'
                }}>
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: '700', fontSize: '0.85rem', color: '#0f172a' }}>{user.username}</div>
                  <div style={{ fontSize: '0.75rem', color: '#64748b' }}>{user.email}</div>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn btn-secondary"
                style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem', color: '#ef4444', borderColor: '#fca5a5' }}
                title="Cerrar Sesión"
              >
                <LogOut size={15} />
                Salir
              </button>
            </div>
          )}
        </div>
      </nav>
    </>
  );
};
