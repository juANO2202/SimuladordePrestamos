import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SimulatorPage } from './pages/SimulatorPage';
import { HistoryPage } from './pages/HistoryPage';
import { ShieldCheck, Landmark } from 'lucide-react';

const MainApp = () => {
  const { isAuthenticated, loading } = useAuth();
  const [authView, setAuthView] = useState('login');
  const [activeTab, setActiveTab] = useState('simulator');

  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f8fafc',
        color: '#0f172a',
        fontWeight: '700',
        fontSize: '1.1rem',
        gap: '0.75rem'
      }}>
        <Landmark size={28} className="animate-spin" color="#0f172a" />
        Iniciando Simulador de Préstamos...
      </div>
    );
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">
        {!isAuthenticated ? (
          <LoginPage />
        ) : (
          activeTab === 'simulator' ? (
            <SimulatorPage />
          ) : (
            <HistoryPage />
          )
        )}
      </main>

      <footer style={{
        background: '#ffffff',
        borderTop: '1px solid #e2e8f0',
        padding: '1.5rem',
        textAlign: 'center',
        fontSize: '0.8rem',
        color: '#64748b',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginBottom: '0.3rem', color: '#475569', fontWeight: '600' }}>
          <ShieldCheck size={16} color="#0f172a" />
          <span>Conexión Segura protegida con JSON Web Tokens (JWT) & Encriptación BCrypt</span>
        </div>
        <div>
          © {new Date().getFullYear()} Simulador de Préstamos. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
