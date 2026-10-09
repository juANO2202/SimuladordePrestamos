import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Landmark, LogOut, Calculator, History } from 'lucide-react';

export const Navbar = ({ activeTab, setActiveTab }) => {
  const { user, logout } = useAuth();

  return (
    <nav className="navbar" aria-label="Navegación principal">
      <div className="navbar-inner">
        <div className="navbar-left">
          <button className="brand" onClick={() => setActiveTab('simulator')} aria-label="Ir al simulador">
            <span className="brand-mark"><Landmark size={17} /></span>
            <span className="brand-text">Simulador de Préstamos</span>
          </button>
        </div>

        {user && (
          <>
            <div className="segmented" role="tablist" style={{ '--index': activeTab === 'simulator' ? 0 : 1 }}>
              <button role="tab" aria-selected={activeTab === 'simulator'} onClick={() => setActiveTab('simulator')}>
                <Calculator size={15} /> Simulador
              </button>
              <button role="tab" aria-selected={activeTab === 'history'} onClick={() => setActiveTab('history')}>
                <History size={15} /> Historial
              </button>
            </div>

            <div className="navbar-right">
              <div className="user-chip">
                <div className="avatar">{user.username.charAt(0).toUpperCase()}</div>
                <div className="user-meta">
                  <strong>{user.username}</strong>
                  <span>{user.email}</span>
                </div>
              </div>
              <button onClick={logout} className="btn btn-secondary btn-sm" title="Cerrar sesión">
                <LogOut size={14} /> Salir
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};
