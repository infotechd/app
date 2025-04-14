
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

// Importação de páginas (exemplos)
import LoginPage from './pages/LoginPage';
import BuyerDashboard from './pages/BuyerDashboard';
import ProviderDashboard from './pages/ProviderDashboard';
import AdvertiserDashboard from './pages/AdvertiserDashboard';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rota pública para login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Rotas protegidas: cada rota exige o tipo de usuário correspondente */}
          <Route
            path="/dashboard-buyer"
            element={
              <PrivateRoute requiredRole="buyer">
                <BuyerDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard-provider"
            element={
              <PrivateRoute requiredRole="prestador">
                <ProviderDashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/dashboard-advertiser"
            element={
              <PrivateRoute requiredRole="anunciante">
                <AdvertiserDashboard />
              </PrivateRoute>
            }
          />
          {/* Outras rotas públicas ou protegidas */}
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
