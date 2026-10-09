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
      <div className="splash">
        <Landmark size={24} className="animate-spin" />
        Iniciando Simulador de Préstamos…
      </div>
    );
  }

  let content;
  if (!isAuthenticated) {
    content = authView === 'login'
      ? <LoginPage onSwitchToRegister={() => setAuthView('register')} />
      : <RegisterPage onSwitchToLogin={() => setAuthView('login')} />;
  } else {
    content = activeTab === 'simulator' ? <SimulatorPage /> : <HistoryPage />;
  }

  return (
    <div className="app-container">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="main-content">{content}</main>

      <footer className="footer">
        <div className="footer-badge">
          <ShieldCheck size={15} />
          Sesión protegida con JSON Web Tokens y contraseñas cifradas con BCrypt
        </div>
        <div>© {new Date().getFullYear()} Simulador de Préstamos. Los resultados son informativos y no constituyen una oferta de crédito.</div>
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
